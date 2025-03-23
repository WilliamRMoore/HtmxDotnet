import { InputAction } from '../../loops/Input';
import { IntersectsPolygons } from '../physics/collisions';
import {
  VectorAdder,
  VectorMultiplier,
  VectorNegator,
  VectorResultAllocator,
  VectorToVectorResultAllocator,
} from '../physics/vector';
import { Player } from '../player/playerOrchestrator';
import { Stage } from '../stage/stageComponents';
import { World } from '../world/world';

const correctionDepth: number = 0.01;

export function StageCollisionDetection(p: Player, s: Stage): boolean {
  const stageVerts = s.StageVerticies.GetVerts();
  const playerVerts = p.CCHull;

  // detect the collision
  const collisionResult = IntersectsPolygons(playerVerts, stageVerts);

  if (collisionResult.collision) {
    let dto = VectorResultAllocator(
      collisionResult.normX,
      collisionResult.normY
    );
    const move = VectorMultiplier(VectorNegator(dto), collisionResult.depth);

    const normalX = collisionResult.normX;
    const normalY = collisionResult.normY;
    const playerPos = p.Postion;
    const playerPosDTO = VectorToVectorResultAllocator(playerPos);

    //Ground correction
    if (normalX == 0 && normalY > 0) {
      //add the correction depth
      move.AddToY(correctionDepth);
      let resolution = VectorAdder(playerPosDTO, move);
      p.SetPlayerPostion(resolution.X, resolution.Y);
      return true;
    }

    //Right wall correction
    if (normalX > 0 && normalY == 0) {
      move.AddToX(correctionDepth);
      let resolution = VectorAdder(playerPosDTO, move);
      p.SetPlayerPostion(resolution.X, resolution.Y);

      return true;
    }

    // Left Wall Correction
    if (normalX < 0 && normalY == 0) {
      move.AddToX(-correctionDepth);
      let resolution = VectorAdder(playerPosDTO, move);
      p.SetPlayerPostion(resolution.X, resolution.Y);

      return true;
    }

    //ceiling
    if (normalX == 0 && normalY < 0) {
      move.AddToY(-correctionDepth);
      let resolution = VectorAdder(playerPosDTO, move);
      p.SetPlayerPostion(resolution.X, resolution.Y);

      return true;
    }

    // corner case, literally
    if (Math.abs(normalX) > 0 && Math.abs(normalY) > 0) {
      const fix = move.X <= 0 ? move.Y : -move.Y;
      move.AddToX(fix);
      move._setY(0);
      const resolution = VectorAdder(playerPosDTO, move);
      p.SetPlayerPostion(resolution.X, resolution.Y);

      return true;
    }

    return false;
  }

  return false;
}

function Gravity(p: Player) {
  if (!p.IsGrounded()) {
    const grav = p.Gravity;
    const fallSpeed = p.IsFastFalling() ? p.FastFallSpeed : p.FallSpeed;
    const GravMutliplier = p.IsFastFalling() ? 1.4 : 1;
    p.AddGravityImpulse(grav * GravMutliplier, fallSpeed);
  }
}

function Input(p: Player, ia: InputAction) {
  // Apply controller input
}

function ApplyVelocty(p: Player) {
  const grounded = p.IsGrounded();
  const playerVelocity = p.Velocity;
  const pvx = playerVelocity.x;
  const pvy = playerVelocity.y;
  const fallSpeed = p.FallSpeed;
  const groundedVelocityDecay = p.GroundedVelocityDecay;
  const aerialVelocityDecay = p.AerialVelocityDecay;

  if (grounded) {
    if (pvx > 0) {
      p.Velocity.x -= groundedVelocityDecay;
    }
    if (pvx < 0) {
      p.Velocity.x += groundedVelocityDecay;
    }

    return;
  }

  if (pvx > 0) {
    p.Velocity.x -= aerialVelocityDecay;
  }

  if (pvx < 0) {
    p.Velocity.x += aerialVelocityDecay;
  }

  // What if we are fast falling?
  if (pvy > fallSpeed) {
    p.Velocity.y -= aerialVelocityDecay;
  }

  if (pvy < 0) {
    p.Velocity.y += aerialVelocityDecay;
  }

  if (Math.abs(pvx) < 3) {
    p.Velocity.x = 0;
  }
}

function OutOfBoundsCheck(w: World) {
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
