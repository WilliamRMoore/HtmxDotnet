import { IntersectsPolygons } from '../physics/collisions';
import { STATES } from '../../FSM/FiniteState';
import { World } from '../world/world';

const correctionDepth: number = 0.01;
export const GROUND_COLLISION: number = 0;
export const LEFT_WALL_COLLISION: number = 1;
export const RIGHT_WALL_COLLISION: number = 2;
export const CEILING_COLLISION: number = 3;
export const CORNER_COLLISION: number = 4;
export const NO_COLLISION: number = 5;

export function StageCollisionDetection(world: World): number {
  const p = world.Player!;
  const sm = world.StateMachine!;

  const playerVelY = p.Velocity.y;

  var collision = _stageCollision(world);

  if (collision === NO_COLLISION) {
    return NO_COLLISION;
  }

  if (collision === GROUND_COLLISION) {
    const landState = playerVelY > 2 ? STATES.LAND : STATES.SOFT_LAND;
    sm.UpdateFromWorld(landState);
    return collision;
  }

  return collision;
}

function _stageCollision(world: World): number {
  const s = world.Stage!;
  const p = world.Player!;
  const vecPool = world.VecPool;
  const colResPool = world.ColResPool;
  const projResPool = world.ProjResPool;

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
    const normalX = collisionResult.normX;
    const normalY = collisionResult.normY;
    const playerPosDTO = vecPool.Rent().SetFromFlatVec(p.Postion);
    const move = vecPool
      .Rent()
      ._setXY(normalX, normalY)
      .Negate()
      .Multiply(collisionResult.depth);

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
      move.AddToX(move.X <= 0 ? move.Y : -move.Y); // add the y valie into x
      move._setY(0);
      playerPosDTO.Add(move);
      p.SetPlayerPostion(playerPosDTO.X, playerPosDTO.Y);

      return CORNER_COLLISION;
    }

    return NO_COLLISION;
  }

  return NO_COLLISION;
}

export function Gravity(world: World) {
  const p = world.Player!;
  const s = world.Stage!;
  if (!p.IsGrounded(s)) {
    const grav = p.Gravity;
    const fallSpeed = p.IsFastFalling() ? p.FastFallSpeed : p.FallSpeed;
    const GravMutliplier = p.IsFastFalling() ? 1.4 : 1;
    p.AddGravityImpulse(grav * GravMutliplier, fallSpeed);
  }
}

export function PlayerInput(world: World) {
  const p1Input = world
    .GetInputManager(world!.Player!.ID)
    .GetInputForFrame(world.localFrame);

  world?.StateMachine?.UpdateFromInput(p1Input, world);
}

export function ApplyVelocty(world: World) {
  const p = world.Player!;
  const s = world.Stage!;

  const grounded = p.IsGrounded(s);
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

export function OutOfBoundsCheck(world: World) {
  const p = world.Player!;
  const s = world.Stage!;

  const pPos = p.Postion;
  const deathBoundry = s.DeathBoundry!;

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
