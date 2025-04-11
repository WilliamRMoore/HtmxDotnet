import { IntersectsPolygons } from '../physics/collisions';
import { GameEvents, STATES } from '../finite-state-machine/PlayerStates';
import { World } from '../world/world';
import { StateMachine } from '../finite-state-machine/PlayerStateMachine';
import { Player, PlayerHelpers } from '../player/playerOrchestrator';

const correctionDepth: number = 0.01;
export const GROUND_COLLISION: number = 0;
export const LEFT_WALL_COLLISION: number = 1;
export const RIGHT_WALL_COLLISION: number = 2;
export const CEILING_COLLISION: number = 3;
export const CORNER_COLLISION: number = 4;
export const NO_COLLISION: number = 5;

export function StageCollisionDetection(world: World): void {
  const playerCount = world.PlayerCount;

  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = world.GetPlayer(playerIndex)!;
    const sm = world.GetStateMachine(playerIndex)!;
    const s = world.Stage!;

    var collision = _stageCollision(world, playerIndex);

    const grnd = PlayerHelpers.IsPlayerGroundedOnStage(p, s);
    const prevGround = PlayerHelpers.IsPlayerPreviouslyGroundedOnStage(p, s);

    // Did we walk off the ledge?
    if (grnd == false && prevGround == true) {
      const CurrentPlayerStateId = p.FSMInfoComponent.CurrentState.StateId;

      if (
        CurrentPlayerStateId === STATES.WALK ||
        CurrentPlayerStateId === STATES.START_WALK ||
        CurrentPlayerStateId === STATES.IDLE ||
        CurrentPlayerStateId === STATES.RUN_TURN ||
        CurrentPlayerStateId === STATES.STOP_RUN
      ) {
        const leftStagePoint = s.StageVerticies.GetGround()[0];
        const rightStagePoint = s.StageVerticies.GetGround()[1];
        const flags = p.FlagsComponent;
        const position = p.PostionComponent;

        if (leftStagePoint.x > position.x && flags.IsFacingLeft()) {
          PlayerHelpers.SetPlayerPosition(
            p,
            leftStagePoint.x + 0.1,
            leftStagePoint.y
          );
          sm.UpdateFromWorld(GameEvents.land);
        }

        if (rightStagePoint.x < position.x && flags.IsFacingRight()) {
          PlayerHelpers.SetPlayerPosition(
            p,
            rightStagePoint.x - 0.1,
            rightStagePoint.y
          );
          sm.UpdateFromWorld(GameEvents.land);
        }
        continue;
      }
    }

    if (collision === NO_COLLISION && grnd == true) {
      sm.UpdateFromWorld(GameEvents.land);
      continue;
    }

    if (collision === NO_COLLISION || grnd === false) {
      sm.UpdateFromWorld(GameEvents.fall);
      continue;
    }

    if (collision !== NO_COLLISION && grnd === true) {
      const playerVelY = p.VelocityComponent.y;
      const landState = playerVelY > 2 ? GameEvents.land : GameEvents.softLand;
      sm.UpdateFromWorld(landState);
      continue;
    }
  }

  return;
}

function _stageCollision(world: World, playerIndex: number): number {
  const s = world.Stage!;
  const p = world.GetPlayer(playerIndex)!;
  const vecPool = world.VecPool;
  const colResPool = world.ColResPool;
  const projResPool = world.ProjResPool;

  const stageVerts = s.StageVerticies.GetVerts();
  const playerVerts = p.ECBComponent.GetHull();

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
    const playerPosDTO = vecPool
      .Rent()
      .SetFromFlatVec(p.PostionComponent.GetAsFlatVec());
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
      //move._setY(0);
      playerPosDTO.Add(move);
      PlayerHelpers.SetPlayerPosition(p, playerPosDTO.X, playerPosDTO.Y);

      return CORNER_COLLISION;
    }

    return NO_COLLISION;
  }

  return NO_COLLISION;
}

export function Gravity(world: World) {
  const playerCount = world.PlayerCount;
  const stage = world.Stage!;
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = world.GetPlayer(playerIndex)!;
    PlayerHelpers.AddGravityToPlayer(p, stage);
  }
}

export function PlayerInput(world: World) {
  const playerCount = world.PlayerCount;
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    world
      .GetStateMachine(playerIndex)
      ?.UpdateFromInput(world.GetPlayerCurrentInput(playerIndex)!, world);
  }
}

export function ApplyVelocty(world: World) {
  const playerCount = world.PlayerCount;
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = world.GetPlayer(playerIndex)!;
    const flags = p.FlagsComponent;
    const speeds = p.SpeedsComponent;
    const s = world.Stage!;

    const grounded = PlayerHelpers.IsPlayerGroundedOnStage(p, s);
    const playerVelocity = p.VelocityComponent;
    const pvx = playerVelocity.x;
    const pvy = playerVelocity.y;
    const fallSpeed = flags.IsFastFalling()
      ? speeds.FastFallSpeed
      : speeds.FallSpeed;
    const groundedVelocityDecay = speeds.GroundedVelocityDecay;
    const aerialVelocityDecay = speeds.AerialVelocityDecay;

    PlayerHelpers.AddToPlayerPosition(p, pvx, pvy);

    if (grounded) {
      if (pvx > 0) {
        playerVelocity.x -= groundedVelocityDecay;
      }
      if (pvx < 0) {
        playerVelocity.x += groundedVelocityDecay;
      }
      if (Math.abs(pvx) < 1) {
        playerVelocity.x = 0;
      }
      continue;
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

    if (Math.abs(pvx) < 1.5) {
      playerVelocity.x = 0;
    }
  }
}

export function OutOfBoundsCheck(world: World) {
  const playerCount = world.PlayerCount;
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const p = world.GetPlayer(playerIndex)!;
    const sm = world.GetStateMachine(playerIndex)!;
    const s = world.Stage!;

    const pPos = p.PostionComponent;
    const deathBoundry = s.DeathBoundry!;

    if (pPos.y < deathBoundry.topBoundry) {
      // kill player if in hit stun.
      KillPlayer(p, sm);
      return;
    }

    if (pPos.y > deathBoundry.bottomBoundry) {
      // kill player?
      KillPlayer(p, sm);
    }

    if (pPos.x < deathBoundry.leftBoundry) {
      // kill Player?
      KillPlayer(p, sm);
    }

    if (pPos.x > deathBoundry.rightBoundry) {
      // kill player?
      KillPlayer(p, sm);
    }
  }
}

function KillPlayer(p: Player, sm: StateMachine) {
  // reset player to spawn point
  PlayerHelpers.SetPlayerInitialPosition(p, 610, 300);
  // reset any stats
  p.VelocityComponent.x = 0;
  p.VelocityComponent.y = 0;
  sm.ForceState(STATES.N_FALL);
  // reduce stock count
}

export function RecordHistory(w: World) {
  const playerCount = w.PlayerCount;
  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    const localFrame = w.localFrame;
    const p = w.GetPlayer(playerIndex);
    const history = w.GetComponentHistory(playerIndex);
    history?.RecordPlayer(p!, localFrame);
  }
}
