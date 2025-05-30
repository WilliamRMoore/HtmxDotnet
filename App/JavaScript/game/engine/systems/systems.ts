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
import { Stage } from '../stage/stageComponents';
import { CollisionResult } from '../pools/CollisionResult';
import { ProjectionResult } from '../pools/ProjectResult';
import { ComponentHistory, ECBComponent } from '../player/playerComponents';
import { ClosestPointsResult } from '../pools/ClosestPointsResult';

const correctionDepth: number = 0.01;
export const GROUND_COLLISION: number = 0;
export const LEFT_WALL_COLLISION: number = 1;
export const RIGHT_WALL_COLLISION: number = 2;
export const CEILING_COLLISION: number = 3;
export const CORNER_COLLISION: number = 4;
export const NO_COLLISION: number = 5;

export function StageCollisionDetection(
  playerCount: number,
  players: Array<Player>,
  stateMachines: Array<StateMachine>,
  stage: Stage,
  vecPool: Pool<PooledVector>,
  colResPool: Pool<CollisionResult>,
  projResPool: Pool<ProjectionResult>
): void {
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = players[playerIndex];
    const pFlags = p.Flags;
    const sm = stateMachines[playerIndex];

    var collision = stageCollision(stage, p, vecPool, colResPool, projResPool);

    if (collision == GROUND_COLLISION) {
      if (p.Velocity.Y > -15) {
        sm.UpdateFromWorld(GAME_EVENTS.SOFT_LAND_GE);
      } else {
        sm.UpdateFromWorld(GAME_EVENTS.LAND_GE);
      }
    }

    const grnd = PlayerHelpers.IsPlayerGroundedOnStage(p, stage);
    const prevGround = PlayerHelpers.IsPlayerPreviouslyGroundedOnStage(
      p,
      stage
    );

    // Did we walk off the ledge?
    if (
      grnd == false &&
      prevGround == true &&
      pFlags.CanWalkOffStage == false
    ) {
      const stageGround = stage.StageVerticies.GetGround();
      const leftStagePoint = stageGround[0];
      const rightStagePoint = stageGround[1];
      const flags = p.Flags;
      const position = p.Postion;

      if (leftStagePoint.X > position.X && flags.IsFacingLeft) {
        PlayerHelpers.SetPlayerPosition(
          p,
          leftStagePoint.X + 0.1,
          leftStagePoint.Y
        );
        sm.UpdateFromWorld(GAME_EVENTS.LAND_GE);
      }

      if (rightStagePoint.X < position.X && flags.IsFacingRight) {
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
      (grnd === false && p.FSMInfo.CurrentStatetId != STATES.LEDGE_GRAB_S)
    ) {
      sm.UpdateFromWorld(GAME_EVENTS.FALL_GE);
      continue;
    }

    // We have a collision and we are landed
    // if (collision !== NO_COLLISION && grnd === true) {
    //   const playerVelY = p.Velocity.Y;
    //   const landState =
    //     playerVelY > 10 ? GAME_EVENTS.LAND_GE : GAME_EVENTS.SOFT_LAND_GE;
    //   sm.UpdateFromWorld(landState);
    //   continue;
    // }
  }
}

function stageCollision(
  stage: Stage,
  player: Player,
  vecPool: Pool<PooledVector>,
  colResPool: Pool<CollisionResult>,
  projResPool: Pool<ProjectionResult>
): number {
  const stageVerts = stage.StageVerticies.GetVerts();
  const playerVerts = player.ECB.GetHull();
  const yOffset = player.ECB.YOffsect;

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
    const pPos = player.Postion;
    const playerPosDTO = vecPool.Rent().SetXY(pPos.X, pPos.Y);
    const move = vecPool
      .Rent()
      .SetXY(normalX, normalY)
      .Negate()
      .Multiply(collisionResult.Depth);

    //move.AddToY(yOffset);

    //Ground correction
    if (normalX == 0 && normalY > 0) {
      //add the correction depth
      move.AddToY(correctionDepth);
      playerPosDTO.Add(move);
      PlayerHelpers.SetPlayerPosition(player, playerPosDTO.X, playerPosDTO.Y);

      return GROUND_COLLISION;
    }

    //Right wall correction
    if (normalX > 0 && normalY == 0) {
      move.AddToX(correctionDepth);
      playerPosDTO.Add(move);
      PlayerHelpers.SetPlayerPosition(player, playerPosDTO.X, playerPosDTO.Y);

      return RIGHT_WALL_COLLISION;
    }

    // Left Wall Correction
    if (normalX < 0 && normalY == 0) {
      move.AddToX(-correctionDepth);
      playerPosDTO.Add(move);
      PlayerHelpers.SetPlayerPosition(player, playerPosDTO.X, playerPosDTO.Y);

      return LEFT_WALL_COLLISION;
    }

    //ceiling
    if (normalX == 0 && normalY < 0) {
      move.AddToY(-correctionDepth);
      playerPosDTO.Add(move);
      PlayerHelpers.SetPlayerPosition(player, playerPosDTO.X, playerPosDTO.Y);

      return CEILING_COLLISION;
    }

    // corner case, literally
    if (Math.abs(normalX) > 0 && Math.abs(normalY) > 0) {
      move.AddToX(move.X <= 0 ? move.Y : -move.Y); // add the y value into x
      playerPosDTO.Add(move);
      PlayerHelpers.SetPlayerPosition(player, playerPosDTO.X, playerPosDTO.Y);

      return CORNER_COLLISION;
    }

    return NO_COLLISION; // This can happen because we use the CC Hull for collision detection, the hull can make contact with the stage, but the current ECB might be off of it completely, as is the case for running off stage
  }

  return NO_COLLISION;
}

export function LedgeGrabDetection(
  playerCount: number,
  players: Array<Player>,
  stateMachines: Array<StateMachine>,
  stage: Stage,
  vecPool: Pool<PooledVector>,
  colResPool: Pool<CollisionResult>,
  projResPool: Pool<ProjectionResult>
) {
  const ledges = stage.Ledges;
  const leftLedge = ledges.GetLeftLedge();
  const rightLedge = ledges.GetRightLedge();

  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = players[playerIndex];

    if (p.Flags.IsInHitPause) {
      continue;
    }

    const sm = stateMachines[playerIndex];
    const flags = p.Flags;
    const ecb = p.ECB;

    if (p.Velocity.Y < 0 || p.FSMInfo.CurrentStatetId == STATES.JUMP_S) {
      continue;
    }

    if (PlayerHelpers.IsPlayerGroundedOnStage(p, stage)) {
      continue;
    }

    const isFacingRight = flags.IsFacingRight;

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

export function PlayerCollisionDetection(
  playerCount: number,
  playerArr: Array<Player>,
  vecPool: Pool<PooledVector>,
  colResPool: Pool<CollisionResult>,
  projResPool: Pool<ProjectionResult>
) {
  if (playerCount < 2) {
    return;
  }
  for (let pIOuter = 0; pIOuter < playerCount; pIOuter++) {
    const checkPlayer = playerArr[pIOuter];
    const checkPlayerStateId = checkPlayer.FSMInfo.CurrentState.StateId;

    if (
      checkPlayerStateId == STATES.LEDGE_GRAB_S ||
      checkPlayer.Flags.IsInHitPause
    ) {
      continue;
    }

    const checkPlayerEcb = checkPlayer.ECB.GetActiveVerts();

    for (let pIInner = pIOuter + 1; pIInner < playerCount; pIInner++) {
      const otherPlayer = playerArr[pIInner];
      const otherPlayerStateId = otherPlayer.FSMInfo.CurrentState.StateId;

      if (
        otherPlayerStateId == STATES.LEDGE_GRAB_S ||
        otherPlayer.Flags.IsInHitPause
      ) {
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

export function Gravity(
  playerCount: number,
  playersArr: Array<Player>,
  stage: Stage
) {
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = playersArr[playerIndex];

    if (p.Flags.IsInHitPause) {
      continue;
    }

    if (
      p.Flags.HasGravity &&
      !PlayerHelpers.IsPlayerGroundedOnStage(p, stage)
    ) {
      PlayerHelpers.AddGravityToPlayer(p, stage);
    }
  }
}

export function PlayerInput(
  playerCount: number,
  playerArr: Array<Player>,
  stateMachines: Array<StateMachine>,
  world: World
) {
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = playerArr[playerIndex];
    if (p.Flags.IsInHitPause) {
      continue;
    }
    const input = world.GetPlayerCurrentInput(playerIndex)!;
    stateMachines[playerIndex]!.UpdateFromInput(input, world);
  }
}

export function PlayerAttacks(
  playerCount: number,
  players: Array<Player>,
  stateMachines: Array<StateMachine>,
  currentFrame: number,
  atkResPool: Pool<AttackResult>,
  vecPool: Pool<PooledVector>,
  colResPool: Pool<CollisionResult>,
  clstsPntsResPool: Pool<ClosestPointsResult>,
  componentHistories: Array<ComponentHistory>
) {
  if (playerCount === 1) {
    return;
  }

  for (let playerIndex = 0; playerIndex < playerCount - 1; playerIndex++) {
    const p1 = players[playerIndex];
    const p2 = players[playerIndex + 1];

    const p1HitsP2Result = p1VsP2(
      currentFrame,
      atkResPool,
      vecPool,
      colResPool,
      clstsPntsResPool,
      componentHistories,
      p1,
      p2
    );
    const p2HitsP1Result = p1VsP2(
      currentFrame,
      atkResPool,
      vecPool,
      colResPool,
      clstsPntsResPool,
      componentHistories,
      p2,
      p1
    );

    if (p1HitsP2Result.Hit && p2HitsP1Result.Hit) {
      //check for clang
      const clang = Math.abs(p1HitsP2Result.Damage - p2HitsP1Result.Damage) < 3;
    }

    if (p1HitsP2Result.Hit) {
      resolveHitResult(p1, p2, stateMachines, p1HitsP2Result, vecPool);
    }

    if (p2HitsP1Result.Hit) {
      resolveHitResult(p2, p1, stateMachines, p2HitsP1Result, vecPool);
    }
  }
}

function resolveHitResult(
  pA: Player,
  pB: Player,
  stateMachines: Array<StateMachine>,
  pAHitsPbResult: AttackResult,
  vecPool: Pool<PooledVector>
) {
  const damage = pAHitsPbResult.Damage;
  pB.Points.AddDamage(damage);

  const kb = CalculateKnockback(pB, pAHitsPbResult);
  const hitStop = CalculateHitStop(damage);
  const hitStunFrames = CalculateHitStun(kb);
  const launchVec = CalculateLaunchVector(
    vecPool,
    pAHitsPbResult,
    pA.Flags.IsFacingRight,
    kb
  );

  pA.Flags.SetHitPauseFrames(Math.floor(hitStop * 0.75));

  if (pA.Postion.X > pB.Postion.X) {
    pB.Flags.FaceRight();
  } else {
    pB.Flags.FaceLeft();
  }

  pB.HitStop.SetHitStop(hitStop);
  pB.HitStun.SetHitStun(hitStunFrames, launchVec.X, launchVec.Y);

  const pBSm = stateMachines[pB.ID]; //world.GetStateMachine(pB.ID)!;

  pBSm.UpdateFromWorld(GAME_EVENTS.HIT_STOP_GE);
}

function p1VsP2(
  currentFrame: number,
  atkResPool: Pool<AttackResult>,
  vecPool: Pool<PooledVector>,
  colResPool: Pool<CollisionResult>,
  clstsPntsResPool: Pool<ClosestPointsResult>,
  componentHistories: Array<ComponentHistory>,
  pA: Player,
  pB: Player
): AttackResult {
  // p1HitBubbles vs p2HurtBubbles
  const pAstateFrame = pA.FSMInfo.CurrentStateFrame;
  const pAAttack = pA.Attacks.GetAttack();

  if (pAAttack === undefined) {
    return atkResPool.Rent();
  }

  if (pAAttack.HasHitPlayer(pB.ID)) {
    return atkResPool.Rent();
  }

  const pAHitBubbles = pAAttack.GetHitBubblesForFrame(pAstateFrame);

  if (pAHitBubbles === undefined) {
    return atkResPool.Rent();
  }

  const pBHurtBubbles = pB.HurtBubbles.HurtCapsules;

  const hurtLength = pBHurtBubbles.length;
  const hitLength = pAHitBubbles.length;

  for (let hurtIndex = 0; hurtIndex < hurtLength; hurtIndex++) {
    const pBHurtBubble = pBHurtBubbles[hurtIndex];

    for (let hitIndex = 0; hitIndex < hitLength; hitIndex++) {
      const pAHitBubble = pAHitBubbles[hitIndex];
      const pAPositionHistory = componentHistories[pA.ID].PositionHistory;
      const previousWorldFrame = currentFrame - 1 < 0 ? 0 : currentFrame - 1;
      const pAPrevPositionDto = vecPool
        .Rent()
        .SetFromFlatVec(pAPositionHistory[previousWorldFrame]);
      const pACurPositionDto = vecPool.Rent().SetXY(pA.Postion.X, pA.Postion.Y);
      const currentStateFrame = pAstateFrame;
      const pAFacingRight = pA.Flags.IsFacingRight;

      const pAhitBubbleCurrentPos = pAHitBubble.GetOffSetForFrameGlobal(
        vecPool,
        pAFacingRight,
        currentStateFrame,
        pACurPositionDto
      )!;

      if (pAhitBubbleCurrentPos === undefined) {
        continue;
      }

      let pAHitBubblePreviousPos = pAHitBubble.GetOffSetForFrameGlobal(
        vecPool,
        pAFacingRight,
        currentStateFrame - 1 < 0 ? 0 : currentStateFrame - 1,
        pAPrevPositionDto
      );

      if (pAHitBubblePreviousPos === undefined) {
        pAHitBubblePreviousPos = vecPool
          .Rent()
          .SetXY(pACurPositionDto.X, pACurPositionDto.Y);
      }

      const pBPosition = pB.Postion;

      const pBStartHurtDto = pBHurtBubble.GetStartPosition(
        pBPosition.X,
        pBPosition.Y,
        vecPool
      );
      const pBEndHurtDto = pBHurtBubble.GetEndPosition(
        pBPosition.X,
        pBPosition.Y,
        vecPool
      );

      const pointsToTest = closestPointsBetweenSegments(
        pAHitBubblePreviousPos,
        pAhitBubbleCurrentPos,
        pBStartHurtDto,
        pBEndHurtDto,
        vecPool,
        clstsPntsResPool
      );

      const pARadius = pAHitBubble.Radius;
      const pBRadius = pBHurtBubble.Radius;
      const testPoint1 = vecPool
        .Rent()
        .SetXY(pointsToTest.C1X, pointsToTest.C1Y);
      const testPoint2 = vecPool
        .Rent()
        .SetXY(pointsToTest.C2X, pointsToTest.C2Y);

      const collision = IntersectsCircles(
        colResPool,
        testPoint1,
        testPoint2,
        pARadius,
        pBRadius
      );

      if (collision.Collision) {
        pAAttack.HitPlayer(pB.ID);
        let attackResult = atkResPool.Rent();
        attackResult.SetTrue(
          pB.ID,
          pAHitBubble.Damage,
          pAHitBubble.Priority,
          collision.NormX,
          collision.NormY,
          collision.Depth,
          pAAttack.BaseKnockBack,
          pAAttack.KnockBackScaling,
          pAHitBubble.launchAngle
        );
        return attackResult;
      }
    }
  }
  return atkResPool.Rent();
}

function CalculateHitStop(damage: number) {
  return Math.floor(damage / 3 + 3);
}

function CalculateHitStun(knockBack: number): number {
  return Math.ceil(knockBack) * 0.4;
}

function CalculateLaunchVector(
  vecPool: Pool<PooledVector>,
  attackRes: AttackResult,
  isFacingRight: boolean,
  knockBack: number
): PooledVector {
  const vec = vecPool.Rent();
  let angleInRadians = attackRes.LaunchAngle * (Math.PI / 180);

  if (isFacingRight === false) {
    angleInRadians = Math.PI - angleInRadians;
  }

  return vec.SetXY(
    Math.cos(angleInRadians) * knockBack,
    -(Math.sin(angleInRadians) * knockBack) / 2
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

export function ApplyVelocty(
  playerCount: number,
  players: Array<Player>,
  stage: Stage
) {
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = players[playerIndex]!;

    if (p.Flags.IsInHitPause) {
      continue;
    }

    const speeds = p.Speeds;
    const grounded = PlayerHelpers.IsPlayerGroundedOnStage(p, stage);
    const playerVelocity = p.Velocity;
    const pvx = playerVelocity.X;
    const pvy = playerVelocity.Y;
    const fallSpeed = p.Flags.IsFastFalling
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

export function TimedFlags(playerCount: number, playerArr: Array<Player>) {
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = playerArr[playerIndex]!;
    const flags = p.Flags;
    if (flags.IsInHitPause === true) {
      flags.DecrementHitPause();
    }
    if (flags.IsIntangible === true) {
      flags.DecrementIntangabilityFrames();
    }
  }
}

export function OutOfBoundsCheck(
  playerCount: number,
  playerArr: Array<Player>,
  playerStateMachineArr: Array<StateMachine>,
  stage: Stage
) {
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = playerArr[playerIndex];
    const sm = playerStateMachineArr[playerIndex];

    const pPos = p.Postion;
    const pY = pPos.Y;
    const pX = pPos.X;
    const deathBoundry = stage.DeathBoundry!;

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

export function RecordHistory(
  frameNumber: number,
  playerCount: number,
  playerArr: Array<Player>,
  playerHistories: Array<ComponentHistory>,
  w: World
) {
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = playerArr[playerIndex]!;
    const history = playerHistories[playerIndex];
    history.PositionHistory[frameNumber] = p.Postion.SnapShot();
    history.FsmInfoHistory[frameNumber] = p.FSMInfo.SnapShot();
    history.PlayerPointsHistory[frameNumber] = p.Points.SnapShot();
    history.VelocityHistory[frameNumber] = p.Velocity.SnapShot();
    history.FlagsHistory[frameNumber] = p.Flags.SnapShot();
    history.LedgeDetectorHistory[frameNumber] = p.LedgeDetector.SnapShot();
    history.PlayerHitStopHistory[frameNumber] = p.HitStop.SnapShot();
    history.PlayerHitStunHistory[frameNumber] = p.HitStun.SnapShot();
    history.EcbHistory[frameNumber] = p.ECB.SnapShot();
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
