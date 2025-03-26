import { InputAction } from '../../loops/Input';
import { IntersectsPolygons } from '../physics/collisions';
import { STATES } from '../../FSM/FiniteState';
import { Player } from '../player/playerOrchestrator';
import { Stage } from '../stage/stageComponents';
import { World } from '../world/world';
import { VecPool } from '../../pools/VecResultPool';
import { CollisionResultPool } from '../../pools/CollisionResultPool';
import { ProjectionResultPool } from '../../pools/ProjectResultPool';

const correctionDepth: number = 0.01;
export const GROUND_COLLISION: number = 0;
export const LEFT_WALL_COLLISION: number = 1;
export const RIGHT_WALL_COLLISION: number = 2;
export const CEILING_COLLISION: number = 3;
export const CORNER_COLLISION: number = 4;
export const NO_COLLISION: number = 5;

export function StageCollisionDetection(
  p: Player,
  s: Stage,
  vecPool: VecPool,
  colResPool: CollisionResultPool,
  projResPool: ProjectionResultPool
): number {
  const playerVelY = p.Velocity.y;

  var collision = _stageCollision(p, s, vecPool, colResPool, projResPool);

  if (collision === NO_COLLISION) {
    return NO_COLLISION;
  }

  if (collision === GROUND_COLLISION) {
    const landState = playerVelY > 2 ? STATES.LAND : STATES.SOFT_LAND;
    p.StateMachine?.UpdateFromWorld(landState);
    return collision;
  }

  return collision;
}

function _stageCollision(
  p: Player,
  s: Stage,
  vecPool: VecPool,
  colResPool: CollisionResultPool,
  projResPool: ProjectionResultPool
): number {
  const stageVerts = s.StageVerticies.GetVerts();
  const playerVerts = p.GetCCHull();

  // detect the collision
  const collisionResult = IntersectsPolygons(
    playerVerts,
    stageVerts,
    vecPool,
    colResPool,
    projResPool
  );

  if (collisionResult.collision) {
    const vec = vecPool.Rent();
    vec._setXY(collisionResult.normX, collisionResult.normY);
    const move = vec.Negate().Multiply(collisionResult.depth);

    const normalX = collisionResult.normX;
    const normalY = collisionResult.normY;
    const playerPosDTO = vecPool.Rent().SetFromFlatVec(p.Postion);

    //Ground correction
    if (normalX == 0 && normalY > 0) {
      //add the correction depth
      move.AddToY(correctionDepth);
      playerPosDTO.Add(move);
      p.SetPlayerPostion(playerPosDTO.X, playerPosDTO.Y);
      return GROUND_COLLISION;
    }

    //Right wall correction
    if (normalX > 0 && normalY == 0) {
      move.AddToX(correctionDepth);
      playerPosDTO.Add(move);
      p.SetPlayerPostion(playerPosDTO.X, playerPosDTO.Y);

      return RIGHT_WALL_COLLISION;
    }

    // Left Wall Correction
    if (normalX < 0 && normalY == 0) {
      move.AddToX(-correctionDepth);
      playerPosDTO.Add(move);
      p.SetPlayerPostion(playerPosDTO.X, playerPosDTO.Y);

      return LEFT_WALL_COLLISION;
    }

    //ceiling
    if (normalX == 0 && normalY < 0) {
      move.AddToY(-correctionDepth);
      playerPosDTO.Add(move);
      p.SetPlayerPostion(playerPosDTO.X, playerPosDTO.Y);

      return CEILING_COLLISION;
    }

    // corner case, literally
    if (Math.abs(normalX) > 0 && Math.abs(normalY) > 0) {
      const fix = move.X <= 0 ? move.Y : -move.Y;
      move.AddToX(fix);
      move._setY(0);
      playerPosDTO.Add(move);
      p.SetPlayerPostion(playerPosDTO.X, playerPosDTO.Y);

      return CORNER_COLLISION;
    }

    return NO_COLLISION;
  }

  return NO_COLLISION;
}

export function Gravity(p: Player) {
  if (!p.IsGrounded()) {
    const grav = p.Gravity;
    const fallSpeed = p.IsFastFalling() ? p.FastFallSpeed : p.FallSpeed;
    const GravMutliplier = p.IsFastFalling() ? 1.4 : 1;
    p.AddGravityImpulse(grav * GravMutliplier, fallSpeed);
  }
}

export function PlayerInput(p: Player, ia: InputAction) {
  p.StateMachine?.UpdateFromInput(ia);
}

export function ApplyVelocty(p: Player) {
  const grounded = p.IsGrounded();
  const playerVelocity = p.Velocity;
  const pvx = playerVelocity.x;
  const pvy = playerVelocity.y;
  const fallSpeed = p.IsFastFalling() ? p.FastFallSpeed : p.FallSpeed;
  const groundedVelocityDecay = p.GroundedVelocityDecay;
  const aerialVelocityDecay = p.AerialVelocityDecay;

  p.AddToPlayerPosition(pvx, pvy);

  if (grounded) {
    if (pvx > 0) {
      playerVelocity.x -= groundedVelocityDecay;
    }
    if (pvx < 0) {
      playerVelocity.x += groundedVelocityDecay;
    }

    return;
  }

  if (pvx > 0) {
    playerVelocity.x -= aerialVelocityDecay;
  }

  if (pvx < 0) {
    playerVelocity.x += aerialVelocityDecay;
  }

  // What if we are fast falling?
  if (pvy > fallSpeed) {
    playerVelocity.y -= aerialVelocityDecay;
  }

  if (pvy < 0) {
    playerVelocity.y += aerialVelocityDecay;
  }

  if (Math.abs(pvx) < 3) {
    playerVelocity.x = 0;
  }
}

export function OutOfBoundsCheck(w: World) {
  const pPos = w.player!.Postion;
  const deathBoundry = w.stage!.DeathBoundry;

  if (pPos.y < deathBoundry.topBoundry) {
    // kill player if in hit stun.
  }

  if (pPos.y > deathBoundry.bottomBoundry) {
    // kill player?
  }

  if (pPos.x < deathBoundry.leftBoundry) {
    // kill Player?
  }

  if (pPos.x > deathBoundry.rightBoundry) {
    // kill player?
  }
}

function KillPlayer(w: World) {
  //reset player stats
  //reduce stock count by one
  //respawn player in correct spawn point
}
