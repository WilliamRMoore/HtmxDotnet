import { Player } from '../../JavaScript/game/engine/player/playerOrchestrator';
import { defaultStage } from '../../JavaScript/game/engine/stage/stageComponents';
import {
  GROUND_COLLISION,
  NO_COLLISION,
  StageCollisionDetection,
} from '../../JavaScript/game/engine/systems/systems';
import { World } from '../../JavaScript/game/engine/world/world';
import { VecPool } from '../../JavaScript/game/pools/VecResultPool';

test('stage collision ground', () => {
  const stage = defaultStage();
  const p = new Player(0);
  const world = new World();
  world.SetPlayer(p);
  world.SetStage(stage);
  p.SetWorld(world);
  p.SetPlayerInitialPosition(700, 455.0);

  const collided = StageCollisionDetection(
    p,
    stage,
    world.VecPool,
    world.ColResPool,
    world.ProjResPool
  );

  expect(collided).toBe(GROUND_COLLISION);

  expect(p.IsGrounded()).toBeTruthy();
});

test('stage collision ground from air', () => {
  const stage = defaultStage();
  const p = new Player(0);
  const world = new World();
  world.SetPlayer(p);
  world.SetStage(stage);
  p.SetWorld(world);
  p.SetPlayerInitialPosition(680, 430.0);

  const collided = StageCollisionDetection(
    p,
    stage,
    world.VecPool,
    world.ColResPool,
    world.ProjResPool
  );

  expect(collided).toBe(NO_COLLISION);

  expect(p.IsGrounded()).toBeFalsy();

  p.SetPlayerPostion(700, 455.0);

  const collided2 = StageCollisionDetection(
    p,
    stage,
    world.VecPool,
    world.ColResPool,
    world.ProjResPool
  );

  expect(collided2).toBe(GROUND_COLLISION);

  expect(p.IsGrounded()).toBeTruthy();

  p.PostTickTask();
});

test('stage collision right wall', () => {
  const stage = defaultStage();
  const p = new Player(0);
  const world = new World();
  world.SetPlayer(p);
  world.SetStage(stage);
  p.SetWorld(world);
  p.SetPlayerInitialPosition(555, 525);

  const collided = StageCollisionDetection(
    p,
    stage,
    world.VecPool,
    world.ColResPool,
    world.ProjResPool
  );
  expect(collided).toBeTruthy();
});

test('stage collision corner case', () => {
  const stage = defaultStage();
  const p = new Player(0);
  const world = new World();
  world.SetPlayer(p);
  world.SetStage(stage);
  p.SetWorld(world);
  p.SetPlayerInitialPosition(595, 460);
  const colided = StageCollisionDetection(
    p,
    stage,
    world.VecPool,
    world.ColResPool,
    world.ProjResPool
  );
  expect(colided).toBeTruthy();
});

// test('continious collision')
