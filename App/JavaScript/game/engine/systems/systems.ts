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
  const playerVerts = p.ECBVerts;

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
      //p.Flags.Ground();
      return true;
    }

    //Right wall correction
    if (normalX > 0 && normalY == 0) {
      move.AddToX(correctionDepth);
      let resolution = VectorAdder(playerPosDTO, move);
      p.SetPlayerPostion(resolution.X, resolution.Y);
      return true;
      // if (!p.Flags.IsGrounded()) {
      //   p.Flags.SetRightWallRiddingTrue();
      //   return true;
      // }
    }

    // Left Wall Correction
    if (normalX < 0 && normalY == 0) {
      move.AddToX(-correctionDepth);
      let resolution = VectorAdder(playerPosDTO, move);
      p.SetPlayerPostion(resolution.X, resolution.Y);
      return true;
      // if (!p.Flags.IsGrounded()) {
      //   p.Flags.SetLeftWallRiddingTrue();
      //   return true;
      // }
    }

    //ceiling
    if (normalX == 0 && normalY < 0) {
      move.AddToY(-correctionDepth);
      let resolution = VectorAdder(playerPosDTO, move);
      p.SetPlayerPostion(resolution.X, resolution.Y);
      return true;
    }

    // corner case

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
  const grav = 0.5;

  if (!p.IsGrounded()) {
    // apply gravity
    p.Velocity.Y += grav;
  }
}

function Input(p: Player, ia: InputAction) {
  // Apply controller input
}

function ApplyVelocty(p: Player) {
  const grounded = p.IsGrounded();
  const playerVelocity = p.Velocity;
  const pvx = playerVelocity.X;
  const pvy = playerVelocity.Y;
  const fallSpeed = p.FallSpeed;
  const groundedVelocityDecay = p.GroundedVelocityDecay;
  const aerialVelocityDecay = p.AerialVelocityDecay;

  if (grounded) {
    if (pvx > 0) {
      p.Velocity.X -= groundedVelocityDecay;
    }
    if (pvx < 0) {
      p.Velocity.X += groundedVelocityDecay;
    }

    return;
  }

  if (pvx > 0) {
    p.Velocity.X -= aerialVelocityDecay;
  }

  if (pvx < 0) {
    p.Velocity.X += aerialVelocityDecay;
  }

  if (pvy > fallSpeed) {
    p.Velocity.Y -= aerialVelocityDecay;
  }

  if (pvy < 0) {
    p.Velocity.Y += aerialVelocityDecay;
  }

  if (Math.abs(pvx) < 3) {
    p.Velocity.X = 0;
  }
}

function OutOfBoundsCheck(w: World) {
  //
}
