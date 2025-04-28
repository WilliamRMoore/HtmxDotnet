import { GAME_EVENTS } from '../../JavaScript/game/engine/finite-state-machine/PlayerStates';
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
  let res = IDLE_STATE_RELATIONS.mappings.GetMapping(GAME_EVENTS.MOVE_GE);
  expect(res).toBe(STATES.START_WALK_S);
  res = IDLE_STATE_RELATIONS.mappings.GetMapping(GAME_EVENTS.MOVE_FAST_GE);
  expect(res).toBe(STATES.DASH_S);
  res = IDLE_STATE_RELATIONS.mappings.GetMapping(GAME_EVENTS.TURN_GE);
  expect(res).toBe(STATES.TURN_S);
  res = IDLE_STATE_RELATIONS.mappings.GetMapping(GAME_EVENTS.JUMP_GE);
  expect(res).toBe(STATES.JUMP_SQUAT_S);
});

//WALK TESTS
test('START_WALK ', () => {
  expect(START_WALK_RELATIONS.mappings.GetMapping(GAME_EVENTS.IDLE_GE)).toBe(
    STATES.IDLE_S
  );
  expect(
    START_WALK_RELATIONS.mappings.GetMapping(GAME_EVENTS.MOVE_FAST_GE)
  ).toBe(STATES.DASH_S);
  expect(START_WALK_RELATIONS.mappings.GetMapping(GAME_EVENTS.JUMP_GE)).toBe(
    STATES.JUMP_SQUAT_S
  );
  expect(START_WALK_RELATIONS.mappings.GetDefaults()).toBe(STATES.WALK_S);
});

test('TURN', () => {
  expect(TURN_RELATIONS.mappings.GetMapping(GAME_EVENTS.JUMP_GE)).toBe(
    STATES.JUMP_SQUAT_S
  );
  expect(TURN_RELATIONS.mappings.GetDefaults()).toBe(STATES.IDLE_S);
});

test('WALK', () => {
  expect(WALK_RELATIONS.mappings.GetMapping(GAME_EVENTS.IDLE_GE)).toBe(
    STATES.IDLE_S
  );
  expect(WALK_RELATIONS.mappings.GetMapping(GAME_EVENTS.JUMP_GE)).toBe(
    STATES.JUMP_SQUAT_S
  );

  const conditions = WALK_RELATIONS.mappings.GetConditions();

  const cond = conditions?.find((c) => c.Name == 'WalkToRun');

  expect(cond).not.toBeUndefined();
});

test('DASH', () => {
  expect(DASH_RELATIONS.mappings.GetMapping(GAME_EVENTS.TURN_GE)).toBe(
    STATES.DASH_TURN_S
  );
  expect(DASH_RELATIONS.mappings.GetMapping(GAME_EVENTS.JUMP_GE)).toBe(
    STATES.JUMP_SQUAT_S
  );
  expect(DASH_RELATIONS.mappings.GetDefaults()).toBe(STATES.RUN_S);
});

test('DASH_TURN', () => {
  expect(DASH_TURN_RELATIONS.mappings.GetMapping(GAME_EVENTS.JUMP_GE)).toBe(
    STATES.JUMP_SQUAT_S
  );
  expect(DASH_TURN_RELATIONS.mappings.GetDefaults()).toBe(STATES.DASH_S);
});

test('RUN', () => {
  expect(RUN_RELATIONS.mappings.GetMapping(GAME_EVENTS.IDLE_GE)).toBe(
    STATES.STOP_RUN_S
  );
  expect(RUN_RELATIONS.mappings.GetMapping(GAME_EVENTS.JUMP_GE)).toBe(
    STATES.JUMP_SQUAT_S
  );

  const con = RUN_RELATIONS.mappings.GetConditions();

  var c = con?.find((c) => c.Name == 'RunToTurn');

  expect(c).not.toBeUndefined();
});

test('RUN_TURN', () => {
  expect(RUN_TURN_RELATIONS.mappings.GetMapping(GAME_EVENTS.JUMP_GE)).toBe(
    STATES.JUMP_SQUAT_S
  );
  expect(RUN_TURN_RELATIONS.mappings.GetDefaults()).toBe(STATES.RUN_S);
});

test('RUN_STOP', () => {
  expect(STOP_RUN_RELATIONS.mappings.GetMapping(GAME_EVENTS.JUMP_GE)).toBe(
    STATES.JUMP_SQUAT_S
  );
  expect(STOP_RUN_RELATIONS.mappings.GetMapping(GAME_EVENTS.MOVE_FAST_GE)).toBe(
    STATES.DASH_S
  );
  expect(STOP_RUN_RELATIONS.mappings.GetDefaults()).toBe(STATES.IDLE_S);
});

test('STOP_RUN_TURN', () => {
  expect(STOP_RUN_RELATIONS.mappings.GetMapping(GAME_EVENTS.JUMP_GE)).toBe(
    STATES.JUMP_SQUAT_S
  );
  expect(STOP_RUN_RELATIONS.mappings.GetMapping(GAME_EVENTS.MOVE_FAST_GE)).toBe(
    STATES.DASH_S
  );
  expect(STOP_RUN_RELATIONS.mappings.GetDefaults()).toBe(STATES.IDLE_S);
});

test('JUMPSQUAT', () => {
  expect(JUMP_SQUAT_RELATIONS.mappings.GetDefaults()).toBe(STATES.JUMP_S);
});

test('JUMP', () => {
  expect(JUMP_RELATIONS.mappings.GetDefaults()).toBe(STATES.N_FALL_S);
});

test('NFALL', () => {
  expect(NFALL_RELATIONS.mappings.GetMapping(GAME_EVENTS.JUMP_GE)).toBe(
    STATES.JUMP_S
  );
  expect(NFALL_RELATIONS.mappings.GetMapping(GAME_EVENTS.DOWN_GE)).toBe(
    STATES.F_FALL_S
  );
});

test('FFALL', () => {
  expect(FFALL_RELATIONS.mappings.GetMapping(GAME_EVENTS.JUMP_GE)).toBe(
    STATES.JUMP_S
  );
});
