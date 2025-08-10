import { GAME_EVENT_IDS } from '../../JavaScript/game/engine/player/finite-state-machine/PlayerStates';
import {
  DASH_RELATIONS,
  DASH_TURN_RELATIONS,
  IDLE_STATE_RELATIONS,
  RUN_RELATIONS,
  RUN_TURN_RELATIONS,
  STOP_RUN_RELATIONS,
  START_WALK_RELATIONS,
  STATE_IDS,
  TURN_RELATIONS,
  WALK_RELATIONS,
  JUMP_SQUAT_RELATIONS,
  JUMP_RELATIONS,
  NFALL_RELATIONS,
  FFALL_RELATIONS,
} from '../../JavaScript/game/engine/player/finite-state-machine/PlayerStates';

// Idle tests
test('IDLE ', () => {
  let res = IDLE_STATE_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.MOVE_GE);
  expect(res).toBe(STATE_IDS.START_WALK_S);
  res = IDLE_STATE_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.MOVE_FAST_GE);
  expect(res).toBe(STATE_IDS.DASH_S);
  res = IDLE_STATE_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.TURN_GE);
  expect(res).toBe(STATE_IDS.TURN_S);
  res = IDLE_STATE_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.JUMP_GE);
  expect(res).toBe(STATE_IDS.JUMP_SQUAT_S);
});

//WALK TESTS
test('START_WALK ', () => {
  expect(START_WALK_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.IDLE_GE)).toBe(
    STATE_IDS.IDLE_S
  );
  expect(
    START_WALK_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.MOVE_FAST_GE)
  ).toBe(STATE_IDS.DASH_S);
  expect(START_WALK_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.JUMP_GE)).toBe(
    STATE_IDS.JUMP_SQUAT_S
  );
  expect(START_WALK_RELATIONS.mappings.GetDefaults()).toBe(STATE_IDS.WALK_S);
});

test('TURN', () => {
  expect(TURN_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.JUMP_GE)).toBe(
    STATE_IDS.JUMP_SQUAT_S
  );
  expect(TURN_RELATIONS.mappings.GetDefaults()).toBe(STATE_IDS.IDLE_S);
});

test('WALK', () => {
  expect(WALK_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.IDLE_GE)).toBe(
    STATE_IDS.IDLE_S
  );
  expect(WALK_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.JUMP_GE)).toBe(
    STATE_IDS.JUMP_SQUAT_S
  );

  const conditions = WALK_RELATIONS.mappings.GetConditions();

  const cond = conditions?.find((c) => c.Name == 'WalkToRun');

  expect(cond).not.toBeUndefined();
});

test('DASH', () => {
  expect(DASH_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.TURN_GE)).toBe(
    STATE_IDS.DASH_TURN_S
  );
  expect(DASH_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.JUMP_GE)).toBe(
    STATE_IDS.JUMP_SQUAT_S
  );
  expect(DASH_RELATIONS.mappings.GetDefaults()).toBe(STATE_IDS.RUN_S);
});

test('DASH_TURN', () => {
  expect(DASH_TURN_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.JUMP_GE)).toBe(
    STATE_IDS.JUMP_SQUAT_S
  );
  expect(DASH_TURN_RELATIONS.mappings.GetDefaults()).toBe(STATE_IDS.DASH_S);
});

test('RUN', () => {
  expect(RUN_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.IDLE_GE)).toBe(
    STATE_IDS.STOP_RUN_S
  );
  expect(RUN_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.JUMP_GE)).toBe(
    STATE_IDS.JUMP_SQUAT_S
  );

  const con = RUN_RELATIONS.mappings.GetConditions();

  var c = con?.find((c) => c.Name == 'RunToTurn');

  expect(c).not.toBeUndefined();
});

test('RUN_TURN', () => {
  expect(RUN_TURN_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.JUMP_GE)).toBe(
    STATE_IDS.JUMP_SQUAT_S
  );
  expect(RUN_TURN_RELATIONS.mappings.GetDefaults()).toBe(STATE_IDS.RUN_S);
});

test('RUN_STOP', () => {
  expect(STOP_RUN_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.JUMP_GE)).toBe(
    STATE_IDS.JUMP_SQUAT_S
  );
  expect(
    STOP_RUN_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.MOVE_FAST_GE)
  ).toBe(STATE_IDS.DASH_S);
  expect(STOP_RUN_RELATIONS.mappings.GetDefaults()).toBe(STATE_IDS.IDLE_S);
});

test('STOP_RUN_TURN', () => {
  expect(STOP_RUN_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.JUMP_GE)).toBe(
    STATE_IDS.JUMP_SQUAT_S
  );
  expect(
    STOP_RUN_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.MOVE_FAST_GE)
  ).toBe(STATE_IDS.DASH_S);
  expect(STOP_RUN_RELATIONS.mappings.GetDefaults()).toBe(STATE_IDS.IDLE_S);
});

test('JUMPSQUAT', () => {
  expect(JUMP_SQUAT_RELATIONS.mappings.GetDefaults()).toBe(STATE_IDS.JUMP_S);
});

test('JUMP', () => {
  expect(JUMP_RELATIONS.mappings.GetDefaults()).toBe(STATE_IDS.N_FALL_S);
});

test('NFALL', () => {
  expect(NFALL_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.JUMP_GE)).toBe(
    STATE_IDS.JUMP_S
  );
  expect(NFALL_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.DOWN_GE)).toBe(
    STATE_IDS.F_FALL_S
  );
});

test('FFALL', () => {
  expect(FFALL_RELATIONS.mappings.GetMapping(GAME_EVENT_IDS.JUMP_GE)).toBe(
    STATE_IDS.JUMP_S
  );
});
