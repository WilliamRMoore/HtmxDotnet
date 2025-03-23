import {
  ZERO_CR_POOL,
  ZERO_PR_POOL,
} from '../../JavaScript/game/engine/physics/collisions';
import {
  SET_POOL,
  ZERO_VR_POOL,
} from '../../JavaScript/game/engine/physics/vector';
import { Player } from '../../JavaScript/game/engine/player/playerOrchestrator';
import { defaultStage } from '../../JavaScript/game/engine/stage/stageComponents';
import { StageCollisionDetection } from '../../JavaScript/game/engine/systems/systems';
import { World } from '../../JavaScript/game/engine/world/world';
import { VecResultPool } from '../../JavaScript/game/pools/VecResultPool';

beforeEach(() => {
  SET_POOL(new VecResultPool(200));
  ZERO_CR_POOL();
  ZERO_PR_POOL();
  ZERO_VR_POOL();
});

test('stage collision ground', () => {
  const stage = defaultStage();
  const p = new Player();
  const world = new World(p, stage);
  p.SetWorld(world);
  p.SetPlayerInitialPosition(700, 455.0);

  const collided = StageCollisionDetection(p, stage);

  expect(collided).toBeTruthy();

  expect(p.IsGrounded()).toBeTruthy();
});

test('stage collision ground from air', () => {
  const stage = defaultStage();
  const p = new Player();
  const world = new World(p, stage);
  p.SetWorld(world);
  p.SetPlayerInitialPosition(680, 430.0);

  const collided = StageCollisionDetection(p, stage);

  expect(collided).toBeFalsy();

  expect(p.IsGrounded()).toBeFalsy();

  p.SetPlayerPostion(700, 455.0);

  const collided2 = StageCollisionDetection(p, stage);

  expect(collided2).toBeTruthy();

  expect(p.IsGrounded()).toBeTruthy();

  p.PreFrameEndTask();
});

test('stage collision right wall', () => {
  const stage = defaultStage();
  const p = new Player();
  p.SetPlayerPostion(555, 525);

  const collided = StageCollisionDetection(p, stage);
  expect(collided).toBeTruthy();
});

test('stage collision corner case', () => {
  const stage = defaultStage();
  const p = new Player();
  p.SetPlayerPostion(595, 460);
  const colided = StageCollisionDetection(p, stage);

  expect(colided).toBeTruthy();
});

// test('continious collision')
