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
  p.SetPlayerInitialPosition(700, 455.0);

  const collided = StageCollisionDetection(world);

  expect(collided).toBe(GROUND_COLLISION);

  expect(p.IsGrounded(world.Stage!)).toBeTruthy();
});

test('stage collision ground from air', () => {
  const stage = defaultStage();
  const p = new Player(0);
  const world = new World();
  world.SetPlayer(p);
  world.SetStage(stage);
  p.SetPlayerInitialPosition(680, 430.0);

  const collided = StageCollisionDetection(world);

  expect(collided).toBe(NO_COLLISION);

  expect(p.IsGrounded(world.Stage!)).toBeFalsy();

  p.SetPlayerPostion(700, 455.0);

  const collided2 = StageCollisionDetection(world);

  expect(collided2).toBe(GROUND_COLLISION);

  expect(p.IsGrounded(world.Stage!)).toBeTruthy();

  p.PostTickTask();
});

test('stage collision right wall', () => {
  const stage = defaultStage();
  const p = new Player(0);
  const world = new World();
  world.SetPlayer(p);
  world.SetStage(stage);
  p.SetPlayerInitialPosition(555, 525);

  const collided = StageCollisionDetection(world);
  expect(collided).toBeTruthy();
});

test('stage collision corner case', () => {
  const stage = defaultStage();
  const p = new Player(0);
  const world = new World();
  world.SetPlayer(p);
  world.SetStage(stage);
  p.SetPlayerInitialPosition(595, 460);
  const colided = StageCollisionDetection(world);
  expect(colided).toBeTruthy();
});

// test('continious collision')
