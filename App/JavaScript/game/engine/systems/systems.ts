import {
  closestPointsBetweenSegments,
  IntersectsCircles,
  IntersectsPolygons,
} from '../physics/collisions';
import {
  GAME_EVENT_IDS,
  STATE_IDS,
} from '../player/finite-state-machine/PlayerStates';
import { World } from '../world/world';
import { StateMachine } from '../player/finite-state-machine/PlayerStateMachine';
import { Player } from '../player/playerOrchestrator';
import { AttackResult } from '../pools/AttackResult';
import { PooledVector } from '../pools/PooledVector';
import { Pool } from '../pools/Pool';
import { Stage } from '../stage/stageComponents';
import { CollisionResult } from '../pools/CollisionResult';
import { ProjectionResult } from '../pools/ProjectResult';
import { ComponentHistory } from '../player/playerComponents';
import { ClosestPointsResult } from '../pools/ClosestPointsResult';
import { ActiveHitBubblesDTO } from '../pools/ActiveAttackHitBubbles';

const correctionDepth: number = 0.01;
export function StageCollisionDetection(
  playerCount: number,
  players: Array<Player>,
  stateMachines: Array<StateMachine>,
  stage: Stage,
  vecPool: Pool<PooledVector>,
  colResPool: Pool<CollisionResult>,
  projResPool: Pool<ProjectionResult>
): void {
  const stageVerts = stage.StageVerticies.GetVerts();

  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = players[playerIndex];
    const sm = stateMachines[playerIndex];
    const playerVerts = p.ECB.GetHull();
    const grnd = p.IsPlayerGroundedOnStage(stage);
    const prvGrnd = p.IsPlayerPreviouslyGroundedOnStage(stage);
    const pFlags = p.Flags;

    if (
      grnd === false &&
      prvGrnd === true &&
      pFlags.CanWalkOffStage === false
    ) {
      const stageGround = stage.StageVerticies.GetGround();
      const leftStagePoint = stageGround[0];
      const rightStagePoint = stageGround[1];
      const position = p.Position;

      // Snap to nearest ledge regardless of facing
      if (
        Math.abs(position.X - leftStagePoint.X) <
        Math.abs(position.X - rightStagePoint.X)
      ) {
        p.SetPlayerPosition(leftStagePoint.X + 0.1, leftStagePoint.Y);
      } else {
        p.SetPlayerPosition(rightStagePoint.X - 0.1, rightStagePoint.Y);
      }
      sm.UpdateFromWorld(GAME_EVENT_IDS.LAND_GE);
      continue;
    }

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
      const pPos = p.Position;
      const yOffset = p.ECB.YOffset;
      const playerPosDTO = vecPool.Rent().SetXY(pPos.X, pPos.Y);
      const move = vecPool
        .Rent()
        .SetXY(normalX, normalY)
        .Negate()
        .Multiply(collisionResult.Depth);

      //Ground correction
      if (normalX == 0 && normalY > 0) {
        move.AddToY(yOffset);
        move.AddToY(correctionDepth);

        if (
          prvGrnd === false &&
          (Math.abs(normalX) > 0 && Math.abs(normalY) > 0) === false
        ) {
          move.AddToY(p.ECB.YOffset);

          // ECB will change after landing, so compensate for the new offset
          // Example: airborne yOffset = -25, grounded yOffset = 0
          const futureYOffset = 0; // grounded ECB yOffset HARD CODED FOR NOW
          const currentYOffset = p.ECB.YOffset;
          const yOffsetDiff = futureYOffset - currentYOffset;
          move.AddToY(yOffsetDiff);
        }

        playerPosDTO.Add(move);
        p.SetPlayerPosition(playerPosDTO.X, playerPosDTO.Y);
        sm.UpdateFromWorld(
          p.Velocity.Y < 8
            ? GAME_EVENT_IDS.SOFT_LAND_GE
            : GAME_EVENT_IDS.LAND_GE
        );

        continue;
      }

      //Right wall correction
      if (normalX > 0 && normalY == 0) {
        move.AddToX(correctionDepth);
        playerPosDTO.Add(move);
        p.SetPlayerPosition(playerPosDTO.X, playerPosDTO.Y);

        continue;
      }

      // Left Wall Correction
      if (normalX < 0 && normalY == 0) {
        move.AddToX(-correctionDepth);
        playerPosDTO.Add(move);
        p.SetPlayerPosition(playerPosDTO.X, playerPosDTO.Y);

        continue;
      }

      //ceiling
      if (normalX == 0 && normalY < 0) {
        move.AddToY(-correctionDepth);
        playerPosDTO.Add(move);
        p.SetPlayerPosition(playerPosDTO.X, playerPosDTO.Y);

        continue;
      }

      // corner case, literally
      if (Math.abs(normalX) > 0 && normalY > 0) {
        move.AddToX(move.X <= 0 ? move.Y : -move.Y); // add the y value into x
        playerPosDTO.Add(move);
        p.SetPlayerPosition(playerPosDTO.X, playerPosDTO.Y);

        continue;
      }

      if (Math.abs(normalX) > 0 && normalY < 0) {
        playerPosDTO.Add(move);
        p.SetPlayerPosition(playerPosDTO.X, playerPosDTO.Y);

        continue;
      }
    }

    // no collision

    if (grnd === false && p.FSMInfo.CurrentStatetId != STATE_IDS.LEDGE_GRAB_S) {
      sm.UpdateFromWorld(GAME_EVENT_IDS.FALL_GE);
      continue;
    }
  }
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

    if (p.Velocity.Y < 0 || p.FSMInfo.CurrentStatetId == STATE_IDS.JUMP_S) {
      continue;
    }

    if (p.IsPlayerGroundedOnStage(stage)) {
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
        sm.UpdateFromWorld(GAME_EVENT_IDS.LEDGE_GRAB_GE);
        p.SetPlayerPosition(
          leftLedge[0].X - ecb.Width / 2 /*25*/,
          p.Position.Y
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
      sm.UpdateFromWorld(GAME_EVENT_IDS.LEDGE_GRAB_GE);
      p.SetPlayerPosition(rightLedge[0].X + ecb.Width / 2, p.Position.Y);
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
      checkPlayerStateId == STATE_IDS.LEDGE_GRAB_S ||
      checkPlayer.Flags.IsInHitPause
    ) {
      continue;
    }

    const checkPlayerEcb = checkPlayer.ECB.GetActiveVerts();

    for (let pIInner = pIOuter + 1; pIInner < playerCount; pIInner++) {
      const otherPlayer = playerArr[pIInner];
      const otherPlayerStateId = otherPlayer.FSMInfo.CurrentState.StateId;

      if (
        otherPlayerStateId == STATE_IDS.LEDGE_GRAB_S ||
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
        const checkPlayerPos = checkPlayer.Position;
        const otherPlayerPos = otherPlayer.Position;
        const checkPlayerX = checkPlayerPos.X;
        const checkPlayerY = checkPlayerPos.Y;
        const otherPlayerX = otherPlayerPos.X;
        const otherPlayerY = otherPlayerPos.Y;

        const moveX = 1.5;

        if (checkPlayerX >= otherPlayerX) {
          checkPlayer.SetPlayerPosition(checkPlayerX + moveX / 2, checkPlayerY);
          otherPlayer.SetPlayerPosition(otherPlayerX - moveX / 2, otherPlayerY);
          continue;
        }

        checkPlayer.SetPlayerPosition(checkPlayerX - moveX / 2, checkPlayerY);
        otherPlayer.SetPlayerPosition(otherPlayerX + moveX / 2, otherPlayerY);
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

    if (p.Flags.HasGravity && !p.IsPlayerGroundedOnStage(stage)) {
      const speeds = p.Speeds;
      const grav = speeds.Gravity;
      const isFF = p.Flags.IsFastFalling;
      const fallSpeed = isFF ? speeds.FastFallSpeed : speeds.FallSpeed;
      const GravMutliplier = isFF ? 2 : 1;
      p.Velocity.AddClampedYImpulse(fallSpeed, grav * GravMutliplier);
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

export function PlayerSensors(
  world: World,
  playerCount: number,
  players: Array<Player>,
  vecPool: Pool<PooledVector>,
  closestPointsPool: Pool<ClosestPointsResult>,
  collisionResultPool: Pool<CollisionResult>
): void {
  if (playerCount < 2) {
    return;
  }
  for (let playerIndex = 0; playerIndex < playerCount - 1; playerIndex++) {
    const pA = players[playerIndex];
    const pB = players[playerIndex + 1];
    const pAVspB = sesnsorDetect(
      pA,
      pB,
      vecPool,
      collisionResultPool,
      closestPointsPool
    );
    const pBVspA = sesnsorDetect(
      pB,
      pA,
      vecPool,
      collisionResultPool,
      closestPointsPool
    );

    if (pAVspB) {
      pA.Sensors.ReactAction(world, pA, pB);
    }

    if (pBVspA) {
      pB.Sensors.ReactAction(world, pB, pB);
    }
  }
}

function sesnsorDetect(
  pA: Player,
  pB: Player,
  vecPool: Pool<PooledVector>,
  colResPool: Pool<CollisionResult>,
  closestPointsPool: Pool<ClosestPointsResult>
) {
  const pSensors = pA.Sensors;
  const pAPos = pA.Position;
  const pAHurtCaps = pA.HurtBubbles.HurtCapsules;
  const pAFacingRight = pA.Flags.IsFacingRight;

  const pACapsLenght = pAHurtCaps.length;
  const sesnsorLength = pSensors.Sensors.length;
  for (let hurtCapIndex = 0; hurtCapIndex < pACapsLenght; hurtCapIndex++) {
    const pHurtCap = pAHurtCaps[hurtCapIndex];
    const hurtCapStart = pHurtCap.GetStartPosition(pAPos.X, pAPos.Y, vecPool);
    const hurtCapEnd = pHurtCap.GetEndPosition(pAPos.X, pAPos.Y, vecPool);
    for (let sensorIndex = 0; sensorIndex < sesnsorLength; sensorIndex++) {
      const sensor = pSensors.Sensors[sensorIndex];

      if (sensor.IsActive === false) {
        continue;
      }

      const sensorPostion = sensor.GetGlobalPosition(
        vecPool,
        pAPos.X,
        pAPos.Y,
        pAFacingRight
      );

      const closestPoints = closestPointsBetweenSegments(
        sensorPostion,
        sensorPostion,
        hurtCapStart,
        hurtCapEnd,
        vecPool,
        closestPointsPool
      );

      const testPoint1 = vecPool
        .Rent()
        .SetXY(closestPoints.C1X, closestPoints.C1Y);

      const testPoint2 = vecPool
        .Rent()
        .SetXY(closestPoints.C2X, closestPoints.C2Y);

      const collisionResult = IntersectsCircles(
        colResPool,
        testPoint1,
        testPoint2,
        sensor.Radius,
        pHurtCap.Radius
      );

      if (collisionResult.Collision) {
        return true;
      }
    }
  }
  return false;
}

export function PlayerAttacks(
  playerCount: number,
  players: Array<Player>,
  stateMachines: Array<StateMachine>,
  currentFrame: number,
  activeHitBuubleDtoPool: Pool<ActiveHitBubblesDTO>,
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
      activeHitBuubleDtoPool,
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
      activeHitBuubleDtoPool,
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

  if (pA.Position.X > pB.Position.X) {
    pB.Flags.FaceRight();
  } else {
    pB.Flags.FaceLeft();
  }

  pB.HitStop.SetHitStop(hitStop);
  pB.HitStun.SetHitStun(hitStunFrames, launchVec.X, launchVec.Y);

  const pBSm = stateMachines[pB.ID];

  pBSm.UpdateFromWorld(GAME_EVENT_IDS.HIT_STOP_GE);
}

/**
 * Checks for and resolves attack collisions between two players for the current frame.
 *
 * @param {number} currentFrame - The current world frame number.
 * @param {Pool<ActiveHitBubblesDTO>} activeHbPool - Pool for renting active hit bubble DTOs.
 * @param {Pool<AttackResult>} atkResPool - Pool for renting attack result objects.
 * @param {Pool<PooledVector>} vecPool - Pool for renting vector objects.
 * @param {Pool<CollisionResult>} colResPool - Pool for renting collision result objects.
 * @param {Pool<ClosestPointsResult>} clstsPntsResPool - Pool for renting closest points result objects.
 * @param {Array<ComponentHistory>} componentHistories - Array of component histories for all players.
 * @param {Player} pA - The attacking player.
 * @param {Player} pB - The defending player.
 * @returns {AttackResult} The result of the attack collision for this frame.
 * */
function p1VsP2(
  currentFrame: number,
  activeHbPool: Pool<ActiveHitBubblesDTO>,
  atkResPool: Pool<AttackResult>,
  vecPool: Pool<PooledVector>,
  colResPool: Pool<CollisionResult>,
  clstsPntsResPool: Pool<ClosestPointsResult>,
  componentHistories: Array<ComponentHistory>,
  pA: Player,
  pB: Player
): AttackResult {
  const pAstateFrame = pA.FSMInfo.CurrentStateFrame;
  const pAAttack = pA.Attacks.GetAttack();

  if (pAAttack === undefined) {
    return atkResPool.Rent();
  }

  if (pAAttack.HasHitPlayer(pB.ID)) {
    return atkResPool.Rent();
  }

  const pAHitBubbles = pAAttack.GetActiveHitBubblesForFrame(
    pAstateFrame,
    activeHbPool.Rent()
  );

  if (pAHitBubbles.Length === 0) {
    return atkResPool.Rent();
  }

  const pBHurtBubbles = pB.HurtBubbles.HurtCapsules;

  const hurtLength = pBHurtBubbles.length;
  const hitLength = pAHitBubbles.Length;

  for (let hurtIndex = 0; hurtIndex < hurtLength; hurtIndex++) {
    const pBHurtBubble = pBHurtBubbles[hurtIndex];

    for (let hitIndex = 0; hitIndex < hitLength; hitIndex++) {
      const pAHitBubble = pAHitBubbles.AtIndex(hitIndex)!;
      const pAPositionHistory = componentHistories[pA.ID].PositionHistory;
      const previousWorldFrame = currentFrame - 1 < 0 ? 0 : currentFrame - 1;
      const pAPrevPositionDto = vecPool
        .Rent()
        .SetFromFlatVec(pAPositionHistory[previousWorldFrame]);
      const pACurPositionDto = vecPool
        .Rent()
        .SetXY(pA.Position.X, pA.Position.Y);
      const currentStateFrame = pAstateFrame;
      const pAFacingRight = pA.Flags.IsFacingRight;

      const pAhitBubbleCurrentPos = pAHitBubble?.GetGlobalPosition(
        vecPool,
        pACurPositionDto.X,
        pACurPositionDto.Y,
        pAFacingRight,
        currentStateFrame
      )!;

      if (pAhitBubbleCurrentPos === undefined) {
        continue;
      }

      let pAHitBubblePreviousPos =
        pAHitBubble?.GetGlobalPosition(
          vecPool,
          pAPrevPositionDto.X,
          pAPrevPositionDto.Y,
          pAFacingRight,
          currentStateFrame - 1 < 0 ? 0 : currentStateFrame - 1
        ) ?? vecPool.Rent().SetXY(pACurPositionDto.X, pACurPositionDto.Y);

      const pBPosition = pB.Position;

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

  return ((p / 10 + (p * d) / 20) * (200 / (w + 100)) * 1.4 + b) * s * 0.013;
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
    const grounded = p.IsPlayerGroundedOnStage(stage);
    const playerVelocity = p.Velocity;
    const pvx = playerVelocity.X;
    const pvy = playerVelocity.Y;
    const fallSpeed = p.Flags.IsFastFalling
      ? speeds.FastFallSpeed
      : speeds.FallSpeed;
    const groundedVelocityDecay = speeds.GroundedVelocityDecay;
    const aerialVelocityDecay = speeds.AerialVelocityDecay;

    p.AddToPlayerPosition(pvx, pvy);

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

    const pPos = p.Position;
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
  p.SetPlayerInitialPosition(610, 300);
  // reset any stats
  p.Jump.ResetJumps();
  p.Jump.IncrementJumps();
  p.Velocity.X = 0;
  p.Velocity.Y = 0;
  p.Points.SubtractMatchPoints(1);
  p.Points.ResetDamagePoints();
  sm.ForceState(STATE_IDS.N_FALL_S);
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
    history.PositionHistory[frameNumber] = p.Position.SnapShot();
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
