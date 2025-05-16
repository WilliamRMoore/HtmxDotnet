import {
  closestPointsBetweenSegments,
  IntersectsCircles,
  IntersectsPolygons,
} from '../physics/collisions';
import { GAME_EVENTS, STATES } from '../finite-state-machine/PlayerStates';
import { World } from '../world/world';
import { StateMachine } from '../finite-state-machine/PlayerStateMachine';
import { Player, PlayerHelpers } from '../player/playerOrchestrator';
import { AttackResult } from '../pools/AttackResult';
import { PooledVector } from '../pools/PooledVector';
import { Pool } from '../pools/Pool';

const correctionDepth: number = 0.01;
export const GROUND_COLLISION: number = 0;
export const LEFT_WALL_COLLISION: number = 1;
export const RIGHT_WALL_COLLISION: number = 2;
export const CEILING_COLLISION: number = 3;
export const CORNER_COLLISION: number = 4;
export const NO_COLLISION: number = 5;

export function StageCollisionDetection(world: World): void {
  const playerCount = world.PlayerCount;
  const s = world.Stage!;

  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = world.GetPlayer(playerIndex)!;
    const pFlags = p.Flags;
    const sm = world.GetStateMachine(playerIndex)!;

    var collision = stageCollision(world, playerIndex);

    const grnd = PlayerHelpers.IsPlayerGroundedOnStage(p, s);
    const prevGround = PlayerHelpers.IsPlayerPreviouslyGroundedOnStage(p, s);

    // Did we walk off the ledge?
    if (
      grnd == false &&
      prevGround == true &&
      pFlags.CanWalkOffStage == false
    ) {
      const stageGround = s.StageVerticies.GetGround();
      const leftStagePoint = stageGround[0];
      const rightStagePoint = stageGround[1];
      const flags = p.Flags;
      const position = p.Postion;

      if (leftStagePoint.X > position.X && flags.IsFacingLeft()) {
        PlayerHelpers.SetPlayerPosition(
          p,
          leftStagePoint.X + 0.1,
          leftStagePoint.Y
        );
        sm.UpdateFromWorld(GAME_EVENTS.LAND_GE);
      }

      if (rightStagePoint.X < position.X && flags.IsFacingRight()) {
        PlayerHelpers.SetPlayerPosition(
          p,
          rightStagePoint.X - 0.1,
          rightStagePoint.Y
        );
        sm.UpdateFromWorld(GAME_EVENTS.LAND_GE);
      }
      continue;
    }

    // We didn't collide this frame, but are still grounded (E.G. Just idling grounded)
    if (collision === NO_COLLISION && grnd == true) {
      sm.UpdateFromWorld(GAME_EVENTS.LAND_GE);
      continue;
    }

    // No collision
    if (
      collision === NO_COLLISION ||
      (grnd === false && p.FSMInfo.CurrentState.StateId != STATES.LEDGE_GRAB_S)
    ) {
      sm.UpdateFromWorld(GAME_EVENTS.FALL_GE);
      continue;
    }

    // We have a collision and we are landed
    if (collision !== NO_COLLISION && grnd === true) {
      const playerVelY = p.Velocity.Y;
      const landState =
        playerVelY > 10 ? GAME_EVENTS.LAND_GE : GAME_EVENTS.SOFT_LAND_GE;
      sm.UpdateFromWorld(landState);
      continue;
    }
  }
}

function stageCollision(world: World, playerIndex: number): number {
  const s = world.Stage!;
  const p = world.GetPlayer(playerIndex)!;
  const vecPool = world.VecPool;
  const colResPool = world.ColResPool;
  const projResPool = world.ProjResPool;

  const stageVerts = s.StageVerticies.GetVerts();
  const playerVerts = p.ECB.GetHull();

  // detect the collision
  const collisionResult = IntersectsPolygons(
    playerVerts,
    stageVerts,
    vecPool,
    colResPool,
    projResPool
  );

  if (collisionResult.Collision) {
    const normalX = collisionResult.NormX;
    const normalY = collisionResult.NormY;
    const pPos = p.Postion;
    const playerPosDTO = vecPool.Rent().SetXY(pPos.X, pPos.Y);
    const move = vecPool
      .Rent()
      .SetXY(normalX, normalY)
      .Negate()
      .Multiply(collisionResult.Depth);

    //Ground correction
    if (normalX == 0 && normalY > 0) {
      //add the correction depth
      move.AddToY(correctionDepth);
      playerPosDTO.Add(move);
      PlayerHelpers.SetPlayerPosition(p, playerPosDTO.X, playerPosDTO.Y);

      return GROUND_COLLISION;
    }

    //Right wall correction
    if (normalX > 0 && normalY == 0) {
      move.AddToX(correctionDepth);
      playerPosDTO.Add(move);
      PlayerHelpers.SetPlayerPosition(p, playerPosDTO.X, playerPosDTO.Y);

      return RIGHT_WALL_COLLISION;
    }

    // Left Wall Correction
    if (normalX < 0 && normalY == 0) {
      move.AddToX(-correctionDepth);
      playerPosDTO.Add(move);
      PlayerHelpers.SetPlayerPosition(p, playerPosDTO.X, playerPosDTO.Y);

      return LEFT_WALL_COLLISION;
    }

    //ceiling
    if (normalX == 0 && normalY < 0) {
      move.AddToY(-correctionDepth);
      playerPosDTO.Add(move);
      PlayerHelpers.SetPlayerPosition(p, playerPosDTO.X, playerPosDTO.Y);

      return CEILING_COLLISION;
    }

    // corner case, literally
    if (Math.abs(normalX) > 0 && Math.abs(normalY) > 0) {
      move.AddToX(move.X <= 0 ? move.Y : -move.Y); // add the y value into x
      playerPosDTO.Add(move);
      PlayerHelpers.SetPlayerPosition(p, playerPosDTO.X, playerPosDTO.Y);

      return CORNER_COLLISION;
    }

    return NO_COLLISION; // This can happen because we use the CC Hull for collision detection, the hull can make contact with the stage, but the current ECB might be off of it completely, as is the case for running off stage
  }

  return NO_COLLISION;
}

export function LedgeGrabDetection(w: World) {
  const playerCount = w.PlayerCount;
  const stage = w.Stage!;
  const ledges = stage.Ledges;
  const leftLedge = ledges.GetLeftLedge();
  const rightLedge = ledges.GetRightLedge();
  const vecPool = w.VecPool;
  const colResPool = w.ColResPool;
  const projResPool = w.ProjResPool;

  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = w.GetPlayer(playerIndex)!;
    const sm = w.GetStateMachine(playerIndex)!;
    const flags = p.Flags;
    const ecb = p.ECB;

    if (p.Velocity.Y < 0 || p.FSMInfo.CurrentStatetId == STATES.JUMP_S) {
      continue;
    }

    if (PlayerHelpers.IsPlayerGroundedOnStage(p, stage)) {
      continue;
    }

    const isFacingRight = flags.IsFacingRight();

    const front =
      isFacingRight == true
        ? p.LedgeDetector.RightSide
        : p.LedgeDetector.LeftSide;

    if (isFacingRight) {
      const intersectsLeftLedge = IntersectsPolygons(
        leftLedge,
        front,
        vecPool,
        colResPool,
        projResPool
      );

      if (intersectsLeftLedge.Collision) {
        sm.UpdateFromWorld(GAME_EVENTS.LEDGE_GRAB_GE);
        PlayerHelpers.SetPlayerPosition(
          p,
          leftLedge[0].X - 25,
          leftLedge[0].Y + (ecb.Bottom.Y - ecb.Top.Y)
        );
      }

      continue;
    }
    const intersectsRightLedge = IntersectsPolygons(
      rightLedge,
      front,
      vecPool,
      colResPool,
      projResPool
    );
    if (intersectsRightLedge.Collision) {
      sm.UpdateFromWorld(GAME_EVENTS.LEDGE_GRAB_GE);
      PlayerHelpers.SetPlayerPosition(
        p,
        rightLedge[0].X + 25,
        rightLedge[0].Y + (ecb.Bottom.Y - ecb.Top.Y)
      );
    }
  }
}

export function PlayerCollisionDetection(world: World) {
  const pCount = world.PlayerCount;
  if (pCount < 2) {
    return;
  }

  const vecPool = world.VecPool;
  const colResPool = world.ColResPool;
  const projResPool = world.ProjResPool;

  for (let pIOuter = 0; pIOuter < pCount; pIOuter++) {
    const checkPlayer = world.GetPlayer(pIOuter)!;
    const checkPlayerStateId = checkPlayer.FSMInfo.CurrentState.StateId;

    if (checkPlayerStateId == STATES.LEDGE_GRAB_S) {
      continue;
    }

    const checkPlayerEcb = checkPlayer.ECB.GetActiveVerts();

    for (let pIInner = pIOuter + 1; pIInner < pCount; pIInner++) {
      const otherPlayer = world.GetPlayer(pIInner)!;
      const otherPlayerStateId = otherPlayer.FSMInfo.CurrentState.StateId;

      if (otherPlayerStateId == STATES.LEDGE_GRAB_S) {
        continue;
      }

      const otherPlayerEcb = otherPlayer.ECB.GetActiveVerts();

      const collision = IntersectsPolygons(
        checkPlayerEcb,
        otherPlayerEcb,
        vecPool,
        colResPool,
        projResPool
      );

      if (collision.Collision) {
        const checkPlayerPos = checkPlayer.Postion;
        const otherPlayerPos = otherPlayer.Postion;
        const checkPlayerX = checkPlayerPos.X;
        const checkPlayerY = checkPlayerPos.Y;
        const otherPlayerX = otherPlayerPos.X;
        const otherPlayerY = otherPlayerPos.Y;

        const moveX = 1.5;

        if (checkPlayerX >= otherPlayerX) {
          PlayerHelpers.SetPlayerPosition(
            checkPlayer,
            checkPlayerX + moveX / 2,
            checkPlayerY
          );
          PlayerHelpers.SetPlayerPosition(
            otherPlayer,
            otherPlayerX - moveX / 2,
            otherPlayerY
          );
          continue;
        }

        PlayerHelpers.SetPlayerPosition(
          checkPlayer,
          checkPlayerX - moveX / 2,
          checkPlayerY
        );
        PlayerHelpers.SetPlayerPosition(
          otherPlayer,
          otherPlayerX + moveX / 2,
          otherPlayerY
        );
      }
    }
  }
}

export function Gravity(world: World) {
  const playerCount = world.PlayerCount;
  const stage = world.Stage!;
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = world.GetPlayer(playerIndex)!;
    if (
      p.Flags.HasGravity &&
      !PlayerHelpers.IsPlayerGroundedOnStage(p, stage)
    ) {
      PlayerHelpers.AddGravityToPlayer(p, stage);
    }
  }
}

export function PlayerInput(world: World) {
  const playerCount = world.PlayerCount;
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const input = world.GetPlayerCurrentInput(playerIndex)!;
    world.GetStateMachine(playerIndex)!.UpdateFromInput(input, world);
  }
}

export function PlayerAttacks(world: World) {
  const playerCount = world.PlayerCount;
  if (playerCount === 1) {
    return;
  }

  for (let playerIndex = 0; playerIndex < playerCount - 1; playerIndex++) {
    const p1 = world.GetPlayer(playerIndex)!;
    const p2 = world.GetPlayer(playerIndex + 1)!;

    const p1HitsP2Result = p1VsP2(world, p1, p2);
    const p2HitsP1Result = p1VsP2(world, p2, p1);

    if (p1HitsP2Result.Hit && p2HitsP1Result.Hit) {
      //check for clang
      const clang = Math.abs(p1HitsP2Result.Damage - p2HitsP1Result.Damage) < 3;
    }

    if (p1HitsP2Result.Hit) {
      const damage = p1HitsP2Result.Damage;
      p2.Points.AddDamage(damage);

      const kb = CalculateKnockback(p2, p1HitsP2Result);
      const hitStunFrames = CalculateHitStun(kb);
      const launchVec = CalculateLaunchVector(
        world.VecPool,
        p1HitsP2Result,
        kb
      );
    }

    if (p2HitsP1Result.Hit) {
      const damage = p2HitsP1Result.Damage;
    }
  }
}

function p1VsP2(world: World, p1: Player, p2: Player): AttackResult {
  // p1HitBubbles vs p2HurtBubbles
  const p1stateFrame = p1.FSMInfo.CurrentStateFrame;
  const p1Attack = p1.Attacks.GetAttack();

  if (p1Attack === undefined) {
    return world.AtkResPool.Rent();
  }

  if (p1Attack.HasHitPlayer(p2.ID)) {
    return world.AtkResPool.Rent();
  }

  const p1HitBubbles = p1Attack.GetHitBubblesForFrame(p1stateFrame);

  if (p1HitBubbles === undefined) {
    return world.AtkResPool.Rent();
  }

  const vecPool = world.VecPool;
  const clossestPointsPool = world.ClstsPntsResPool;

  const p2HurtBubbles = p2.HurtBubbles.HurtCapsules;

  const hurtLength = p2HurtBubbles.length;
  const hitLength = p1HitBubbles.length;

  for (let hurtIndex = 0; hurtIndex < hurtLength; hurtIndex++) {
    const p2HurtBubble = p2HurtBubbles[hurtIndex];

    for (let hitIndex = 0; hitIndex < hitLength; hitIndex++) {
      const p1HitBubble = p1HitBubbles[hitIndex];
      const p1PositionHistory = world.GetComponentHistory(p1.ID)
        ?.PositionHistory!;
      const previousWorldFrame =
        world.localFrame - 1 < 0 ? 0 : world.localFrame - 1;
      const p1PrevPositionDto = vecPool
        .Rent()
        .SetFromFlatVec(p1PositionHistory[previousWorldFrame]);
      const p1CurPositionDto = vecPool.Rent().SetXY(p1.Postion.X, p1.Postion.Y);
      const currentStateFrame = p1.FSMInfo.CurrentStateFrame;

      let globalCurrentHitBubPositionDto = p1HitBubble.GetOffSetForFrameGlobal(
        vecPool,
        p1.Flags.IsFacingRight(),
        currentStateFrame,
        p1CurPositionDto
      )!;

      if (globalCurrentHitBubPositionDto === undefined) {
        continue;
      }

      let gloablPreviousHitBubPositionDto = p1HitBubble.GetOffSetForFrameGlobal(
        vecPool,
        p1.Flags.IsFacingRight(),
        currentStateFrame - 1 < 0 ? 0 : currentStateFrame - 1,
        p1PrevPositionDto
      );

      if (gloablPreviousHitBubPositionDto === undefined) {
        gloablPreviousHitBubPositionDto = vecPool
          .Rent()
          .SetXY(p1CurPositionDto.X, p1CurPositionDto.Y);
      }

      const p2Position = p2.Postion;

      const p2StartHurtDto = p2HurtBubble.GetStartPosition(
        p2Position.X,
        p2Position.Y,
        vecPool
      );
      const p2EndHurtDto = p2HurtBubble.GetEndPosition(
        p2Position.X,
        p2Position.Y,
        vecPool
      );

      const pointsToTest = closestPointsBetweenSegments(
        gloablPreviousHitBubPositionDto,
        globalCurrentHitBubPositionDto,
        p2StartHurtDto,
        p2EndHurtDto,
        vecPool,
        clossestPointsPool
      );

      const p1Radius = p1HitBubble.Radius;
      const p2Radius = p2HurtBubble.Radius;
      const testPoint1 = vecPool
        .Rent()
        .SetXY(pointsToTest.C1X, pointsToTest.C1Y);
      const testPoint2 = vecPool
        .Rent()
        .SetXY(pointsToTest.C2X, pointsToTest.C2Y);

      const collision = IntersectsCircles(
        world.ColResPool,
        testPoint1,
        testPoint2,
        p1Radius,
        p2Radius
      );

      if (collision.Collision) {
        p1Attack.HitPlayer(p2.ID);
        let attackResult = world.AtkResPool.Rent();
        attackResult.SetTrue(
          p2.ID,
          p1HitBubble.Damage,
          p1HitBubble.Priority,
          collision.NormX,
          collision.NormY,
          collision.Depth,
          p1Attack.BaseKnockBack,
          p1Attack.KnockBackScaling,
          p1HitBubble.launchAngle
        );
        return attackResult;
      }
    }
  }
  return world.AtkResPool.Rent();
}

function CalculateHitStun(knockBack: number): number {
  return Math.ceil(knockBack) * 0.4;
}

function CalculateLaunchVector(
  vecPool: Pool<PooledVector>,
  attackRes: AttackResult,
  knockBack: number
): PooledVector {
  const vec = vecPool.Rent();
  const angleInRadians = attackRes.LaunchAngle * (Math.PI / 180);
  return vec.SetXY(
    Math.cos(angleInRadians) * knockBack,
    Math.sin(angleInRadians) * knockBack
  );
}

function CalculateKnockback(player: Player, attackRes: AttackResult): number {
  const p = player.Points.Damage;
  const d = attackRes.Damage;
  const w = player.Weight.Weight;
  const s = attackRes.KnockBackScaling;
  const b = attackRes.BaseKnockBack;

  return ((p / 10 + (p * d) / 20) * (200 / (w + 100)) * 1.4 + b) * s * 0.01;
}

export function ApplyVelocty(world: World) {
  const playerCount = world.PlayerCount;
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = world.GetPlayer(playerIndex)!;
    const speeds = p.Speeds;
    const s = world.Stage!;

    const grounded = PlayerHelpers.IsPlayerGroundedOnStage(p, s);
    const playerVelocity = p.Velocity;
    const pvx = playerVelocity.X;
    const pvy = playerVelocity.Y;
    const fallSpeed = p.Flags.IsFastFalling()
      ? speeds.FastFallSpeed
      : speeds.FallSpeed;
    const groundedVelocityDecay = speeds.GroundedVelocityDecay;
    const aerialVelocityDecay = speeds.AerialVelocityDecay;

    PlayerHelpers.AddToPlayerPosition(p, pvx, pvy);

    if (grounded) {
      if (pvx > 0) {
        playerVelocity.X -= groundedVelocityDecay;
      }
      if (pvx < 0) {
        playerVelocity.X += groundedVelocityDecay;
      }
      if (Math.abs(pvx) < 1) {
        playerVelocity.X = 0;
      }

      if (pvy > 0) {
        playerVelocity.Y = 0;
      }
      continue;
    }

    if (pvx > 0) {
      playerVelocity.X -= aerialVelocityDecay;
    }

    if (pvx < 0) {
      playerVelocity.X += aerialVelocityDecay;
    }

    if (pvy > fallSpeed) {
      playerVelocity.Y -= aerialVelocityDecay;
    }

    if (pvy < 0) {
      playerVelocity.Y += aerialVelocityDecay;
    }

    if (Math.abs(pvx) < 1.5) {
      playerVelocity.X = 0;
    }
  }
}

export function OutOfBoundsCheck(world: World) {
  const playerCount = world.PlayerCount;
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = world.GetPlayer(playerIndex)!;
    const sm = world.GetStateMachine(playerIndex)!;
    const s = world.Stage!;

    const pPos = p.Postion;
    const pY = pPos.Y;
    const pX = pPos.X;
    const deathBoundry = s.DeathBoundry!;

    if (pY < deathBoundry.topBoundry) {
      // kill player if in hit stun.
      KillPlayer(p, sm);
      return;
    }

    if (pY > deathBoundry.bottomBoundry) {
      // kill player?
      KillPlayer(p, sm);
    }

    if (pX < deathBoundry.leftBoundry) {
      // kill Player?
      KillPlayer(p, sm);
    }

    if (pX > deathBoundry.rightBoundry) {
      // kill player?
      KillPlayer(p, sm);
    }
  }
}

function KillPlayer(p: Player, sm: StateMachine) {
  // reset player to spawn point
  PlayerHelpers.SetPlayerInitialPosition(p, 610, 300);
  // reset any stats
  p.Jump.ResetJumps();
  p.Jump.IncrementJumps();
  p.Velocity.X = 0;
  p.Velocity.Y = 0;
  p.Points.SubtractMatchPoints(1);
  p.Points.ResetDamagePoints();
  sm.ForceState(STATES.N_FALL_S);
  // reduce stock count
}

export function RecordHistory(w: World) {
  const playerCount = w.PlayerCount;
  const frameNumber = w.localFrame;
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = w.GetPlayer(playerIndex)!;
    const history = w.GetComponentHistory(playerIndex)!;
    history.PositionHistory[frameNumber] = p.Postion.SnapShot();
    history.FsmInfoHistory[frameNumber] = p.FSMInfo.SnapShot();
    history.PlayerPointsHistory[frameNumber] = p.Points.SnapShot();
    history.VelocityHistory[frameNumber] = p.Velocity.SnapShot();
    history.FlagsHistory[frameNumber] = p.Flags.SnapShot();
    history.LedgeDetectorHistory[frameNumber] = p.LedgeDetector.SnapShot();
    history.EcbHistory[frameNumber] = p.ECB.SnapShot();
    //history.HurtCirclesHistory[frameNumber] = p.HurtBubbles.SnapShot();
    history.JumpHistroy[frameNumber] = p.Jump.SnapShot();
    history.AttackHistory[frameNumber] = p.Attacks.SnapShot();
  }
  w.SetPoolHistory(
    frameNumber,
    w.VecPool.ActiveCount,
    w.ColResPool.ActiveCount,
    w.ProjResPool.ActiveCount
  );
}
