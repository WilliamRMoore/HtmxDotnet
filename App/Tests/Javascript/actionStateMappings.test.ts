import { GameEvents } from '../../JavaScript/game/engine/finite-state-machine/PlayerStates';
import {
  DASH_RELATIONS,
  DASH_TURN_RELATIONS,
  IDLE_STATE_RELATIONS,
  RUN_RELATIONS,
  RUN_TURN_RELATIONS,
  STOP_RUN_RELATIONS,
  START_WALK_RELATIONS,
  STATES,
  TURN_RELATIONS,
  WALK_RELATIONS,
  JUMP_SQUAT_RELATIONS,
  JUMP_RELATIONS,
  NFALL_RELATIONS,
  FFALL_RELATIONS,
} from '../../JavaScript/game/engine/finite-state-machine/PlayerStates';

// Idle tests
test('IDLE ', () => {
  let res = IDLE_STATE_RELATIONS.mappings.getMapping(GameEvents.move);
  expect(res).toBe(STATES.START_WALK);
  res = IDLE_STATE_RELATIONS.mappings.getMapping(GameEvents.moveFast);
  expect(res).toBe(STATES.DASH);
  res = IDLE_STATE_RELATIONS.mappings.getMapping(GameEvents.turn);
  expect(res).toBe(STATES.TURN);
  res = IDLE_STATE_RELATIONS.mappings.getMapping(GameEvents.jump);
  expect(res).toBe(STATES.JUMP_SQUAT);
});

//WALK TESTS
test('START_WALK ', () => {
  expect(START_WALK_RELATIONS.mappings.getMapping(GameEvents.idle)).toBe(
    STATES.IDLE
  );
  expect(START_WALK_RELATIONS.mappings.getMapping(GameEvents.moveFast)).toBe(
    STATES.DASH
  );
  expect(START_WALK_RELATIONS.mappings.getMapping(GameEvents.jump)).toBe(
    STATES.JUMP_SQUAT
  );
  expect(START_WALK_RELATIONS.mappings.getDefaults()).toBe(STATES.WALK);
});

test('TURN', () => {
  expect(TURN_RELATIONS.mappings.getMapping(GameEvents.jump)).toBe(
    STATES.JUMP_SQUAT
  );
  expect(TURN_RELATIONS.mappings.getDefaults()).toBe(STATES.IDLE);
});

test('WALK', () => {
  expect(WALK_RELATIONS.mappings.getMapping(GameEvents.idle)).toBe(STATES.IDLE);
  expect(WALK_RELATIONS.mappings.getMapping(GameEvents.jump)).toBe(
    STATES.JUMP_SQUAT
  );

  const conditions = WALK_RELATIONS.mappings.GetConditions();

  const cond = conditions?.find((c) => c.Name == 'WalkToRun');

  expect(cond).not.toBeUndefined();
});

test('DASH', () => {
  expect(DASH_RELATIONS.mappings.getMapping(GameEvents.turn)).toBe(
    STATES.DASH_TURN
  );
  expect(DASH_RELATIONS.mappings.getMapping(GameEvents.jump)).toBe(
    STATES.JUMP_SQUAT
  );
  expect(DASH_RELATIONS.mappings.getDefaults()).toBe(STATES.RUN);
});

test('DASH_TURN', () => {
  expect(DASH_TURN_RELATIONS.mappings.getMapping(GameEvents.jump)).toBe(
    STATES.JUMP_SQUAT
  );
  expect(DASH_TURN_RELATIONS.mappings.getDefaults()).toBe(STATES.DASH);
});

test('RUN', () => {
  expect(RUN_RELATIONS.mappings.getMapping(GameEvents.idle)).toBe(
    STATES.STOP_RUN
  );
  expect(RUN_RELATIONS.mappings.getMapping(GameEvents.jump)).toBe(
    STATES.JUMP_SQUAT
  );

  const con = RUN_RELATIONS.mappings.GetConditions();

  var c = con?.find((c) => c.Name == 'RunToTurn');

  expect(c).not.toBeUndefined();
});

test('RUN_TURN', () => {
  expect(RUN_TURN_RELATIONS.mappings.getMapping(GameEvents.jump)).toBe(
    STATES.JUMP_SQUAT
  );
  expect(RUN_TURN_RELATIONS.mappings.getDefaults()).toBe(STATES.RUN);
});

test('RUN_STOP', () => {
  expect(STOP_RUN_RELATIONS.mappings.getMapping(GameEvents.jump)).toBe(
    STATES.JUMP_SQUAT
  );
  expect(STOP_RUN_RELATIONS.mappings.getMapping(GameEvents.moveFast)).toBe(
    STATES.DASH
  );
  expect(STOP_RUN_RELATIONS.mappings.getDefaults()).toBe(STATES.IDLE);
});

test('STOP_RUN_TURN', () => {
  expect(STOP_RUN_RELATIONS.mappings.getMapping(GameEvents.jump)).toBe(
    STATES.JUMP_SQUAT
  );
  expect(STOP_RUN_RELATIONS.mappings.getMapping(GameEvents.moveFast)).toBe(
    STATES.DASH
  );
  expect(STOP_RUN_RELATIONS.mappings.getDefaults()).toBe(STATES.IDLE);
});

test('JUMPSQUAT', () => {
  expect(JUMP_SQUAT_RELATIONS.mappings.getDefaults()).toBe(STATES.JUMP);
});

test('JUMP', () => {
  expect(JUMP_RELATIONS.mappings.getDefaults()).toBe(STATES.N_FALL);
});

test('NFALL', () => {
  expect(NFALL_RELATIONS.mappings.getMapping(GameEvents.jump)).toBe(
    STATES.JUMP
  );
  expect(NFALL_RELATIONS.mappings.getMapping(GameEvents.down)).toBe(
    STATES.F_FALL
  );
});

test('FFALL', () => {
  expect(FFALL_RELATIONS.mappings.getMapping(GameEvents.jump)).toBe(
    STATES.JUMP
  );
});
