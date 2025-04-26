import { Player, PlayerHelpers } from '../player/playerOrchestrator';
import { EaseIn } from '../utils';
import { World } from '../world/world';
import { FSMState } from './PlayerStateMachine';

// Aliases =====================================

export type gameEventId = number;
export type stateId = number;

// Constants ===================================

//Postfixed with _GE for game event. So you know you are looking at game event Ids.
class _GameEvents {
  public readonly UP_SPECIAL_GE = 0;
  public readonly DOWN_SPECIAL_GE = 1;
  public readonly SIDE_SPECIAL_GE = 2;
  public readonly SPECIAL_GE = 3;
  public readonly UP_ATTACK_GE = 4;
  public readonly DOWN_ATTACK_GE = 5;
  public readonly SIDE_ATTACK_GE = 6;
  public readonly ATTACK_GE = 7;
  public readonly IDLE_GE = 8;
  public readonly MOVE_GE = 9;
  public readonly MOVE_FAST_GE = 10;
  public readonly JUMP_GE = 11;
  public readonly GRAB_GE = 12;
  public readonly GUARD_GE = 13;
  public readonly DOWN_GE = 14;
  public readonly TURN_GE = 15;
  // End of GameEvents that can be source from player input
  public readonly LAND_GE = 16;
  public readonly SOFT_LAND_GE = 17;
  public readonly FALL_GE = 18;
  public readonly LEDGE_GRAB_GE = 19;
}

export const GAME_EVENTS = new _GameEvents();

//Postfixed _S for state, so you know you are looking at state Ids.
class _STATES {
  public readonly IDLE_S = 0 as stateId;
  public readonly START_WALK_S = 1 as stateId;
  public readonly TURN_S = 2 as stateId;
  public readonly WALK_S = 3 as stateId;
  public readonly DASH_S = 4 as stateId;
  public readonly DASH_TURN_S = 5 as stateId;
  public readonly STOP_RUN_S = 6 as stateId;
  public readonly RUN_TURN_S = 7 as stateId;
  public readonly STOP_RUN_TURN_S = 8 as stateId;
  public readonly RUN_S = 9 as stateId;
  public readonly JUMP_SQUAT_S = 10 as stateId;
  public readonly JUMP_S = 11 as stateId;
  public readonly N_FALL_S = 12 as stateId;
  public readonly F_FALL_S = 13 as stateId;
  public readonly LAND_S = 14 as stateId;
  public readonly SOFT_LAND_S = 15 as stateId;
  public readonly LEDGE_GRAB_S = 16 as stateId;
  public readonly AIR_DODGE_S = 17 as stateId;
  public readonly HELPESS_S = 18 as stateId;
}

export const STATES = new _STATES();

//Conditional functions =================================================

type conditionFunc = (world: World, playerIndex: number) => boolean;

type condition = {
  Name: string;
  ConditionFunc: conditionFunc;
  StateId: stateId;
};

export function RunCondition(
  c: condition,
  w: World,
  playerIndex: number
): stateId | undefined {
  if (c.ConditionFunc(w, playerIndex)) {
    return c.StateId;
  }
  return undefined;
}

const IdleToDashturn: condition = {
  Name: 'IdleToTurnDash',
  ConditionFunc: (w, playerIndex) => {
    const p = w.GetPlayer(playerIndex)!;
    const input = w.GetPlayerCurrentInput(playerIndex)!;
    if (input.LXAxsis < -0.5 && p.Flags.IsFacingRight()) {
      return true;
    }
    if (input.LXAxsis > 0.5 && p.Flags.IsFacingLeft()) {
      return true;
    }

    return false;
  },
  StateId: STATES.DASH_TURN_S,
};

const IdleToTurn: condition = {
  Name: 'IdleToTurn',
  ConditionFunc: (w, playerIndex) => {
    const p = w.GetPlayer(playerIndex)!;
    const flags = p.Flags;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;

    if (ia.LXAxsis < 0 && flags.IsFacingRight()) {
      return true;
    }

    if (ia.LXAxsis > 0 && flags.IsFacingLeft()) {
      return true;
    }

    return false;
  },
  StateId: STATES.TURN_S,
};

const WalkToTurn: condition = {
  Name: 'WalkToTurn',
  ConditionFunc: (w, playerIndex) => {
    const p = w.GetPlayer(playerIndex)!;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;
    const prevIa = w.GetPlayerPreviousInput(playerIndex);

    if (prevIa === undefined) {
      return false;
    }

    const prevLax = prevIa.LXAxsis;
    const curLax = ia.LXAxsis;
    if ((prevLax < 0 && curLax > 0) || (prevLax > 0 && curLax < 0)) {
      return true;
    }

    const flags = p.Flags;
    if (
      (prevLax === 0 && flags.IsFacingRight() && curLax < 0) ||
      (prevLax === 0 && flags.IsFacingLeft() && curLax > 0)
    ) {
      return true;
    }

    return false;
  },
  StateId: STATES.TURN_S,
};

const RunToTurn: condition = {
  Name: 'RunToTurn',
  ConditionFunc: (w, playerIndex) => {
    const p = w.GetPlayer(playerIndex)!;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;
    const prevIa = w.GetPlayerPreviousInput(playerIndex);

    if (prevIa == undefined) {
      return false;
    }

    const prevLax = prevIa.LXAxsis;
    const curLax = ia.LXAxsis;

    if ((prevLax < 0 && curLax > 0) || (prevLax > 0 && curLax < 0)) {
      return true;
    }

    const flags = p.Flags;
    if (
      (prevLax === 0 && flags.IsFacingRight() && curLax < 0) ||
      (prevLax === 0 && flags.IsFacingLeft() && curLax > 0)
    ) {
      return true;
    }

    return false;
  },
  StateId: STATES.RUN_TURN_S,
};

const DashToTurn: condition = {
  Name: 'DashToTurn',
  ConditionFunc: (w, playerIndex) => {
    const p = w.GetPlayer(playerIndex)!;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;
    const prevIa = w.GetPlayerPreviousInput(playerIndex);

    if (prevIa === undefined) {
      return false;
    }

    const prevLax = prevIa.LXAxsis; // Previous left stick X-axis
    const curLax = ia.LXAxsis; // Current left stick X-axis
    const laxDifference = curLax - prevLax; // Difference between current and previous X-axis
    const threshold = 0.5; // Threshold for detecting significant variation

    const flags = p.Flags;
    const facingRight = flags.IsFacingRight();
    // Check if the variation exceeds the threshold and is in the opposite direction of the player's facing direction
    if (laxDifference < -threshold && facingRight) {
      // Player is facing right, but the stick moved significantly to the left
      if (curLax < 0) {
        return true;
      }
    }

    if (laxDifference > threshold && !facingRight) {
      // Player is facing left, but the stick moved significantly to the right
      if (curLax > 0) {
        return true;
      }
    }

    return false;
  },
  StateId: STATES.DASH_TURN_S,
};

const ToJump: condition = {
  Name: 'ToJump',
  ConditionFunc: (w, playerIndex) => {
    const player = w.GetPlayer(playerIndex);
    const currentInput = w.GetPlayerCurrentInput(playerIndex)!;
    const prevInput = w.GetPlayerPreviousInput(playerIndex);
    const jumpId = GAME_EVENTS.JUMP_GE;

    if (
      currentInput.Action === jumpId &&
      prevInput?.Action !== jumpId &&
      player?.Jump.HasJumps()
    ) {
      return true;
    }

    return false;
  },
  StateId: STATES.JUMP_S,
};

const ToAirDodge: condition = {
  Name: 'ToAirDodge',
  ConditionFunc: (w, playerIndex) => {
    const currentInput = w.GetPlayerCurrentInput(playerIndex);
    if (currentInput?.Action == GAME_EVENTS.GUARD_GE) {
      return true;
    }
    return false;
  },
  StateId: STATES.AIR_DODGE_S,
};

const DashDefaultRun: condition = {
  Name: 'DashDefaultRun',
  ConditionFunc: (w, playerIndex) => {
    const p = w.GetPlayer(playerIndex)!;
    const flags = p.Flags;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;

    if (ia.LXAxsis > 0 && flags.IsFacingRight()) {
      return true;
    }

    if (ia.LXAxsis < 0 && flags.IsFacingLeft()) {
      return true;
    }

    return false;
  },
  StateId: STATES.RUN_S,
};

const DashDefaultIdle: condition = {
  Name: 'DashDefaultIdle',
  ConditionFunc: (w, playerIndex) => {
    const ia = w.GetPlayerCurrentInput(playerIndex)!;

    if (ia.LXAxsis === 0) {
      return true;
    }

    return false;
  },
  StateId: STATES.IDLE_S,
};

const TurnDefaultWalk: condition = {
  Name: 'TurnDefaultWalk',
  ConditionFunc: (w, playerIndex) => {
    const ia = w.GetPlayerCurrentInput(playerIndex);
    const p = w.GetPlayer(playerIndex);
    const facingRight = p?.Flags.IsFacingRight();

    if ((facingRight && ia!.LXAxsis < 0) || (!facingRight && ia!.LXAxsis > 0)) {
      return true;
    }
    return false;
  },
  StateId: STATES.WALK_S,
};

const defaultWalk: condition = {
  Name: 'Walk',
  ConditionFunc: (w: World) => {
    return true;
  },
  StateId: STATES.WALK_S,
};

const defaultRun: condition = {
  Name: 'Run',
  ConditionFunc: (w: World) => {
    return true;
  },
  StateId: STATES.RUN_S,
};

const defaultIdle: condition = {
  Name: 'Idle',
  ConditionFunc: (w: World) => {
    return true;
  },
  StateId: STATES.IDLE_S,
};

const defaultDash: condition = {
  Name: 'Dash',
  ConditionFunc: (w: World) => {
    return true;
  },
  StateId: STATES.DASH_S,
};

const defaultJump: condition = {
  Name: 'Jump',
  ConditionFunc: (w: World) => {
    return true;
  },
  StateId: STATES.JUMP_S,
};

const defaultNFall: condition = {
  Name: 'NFall',
  ConditionFunc: (w: World) => {
    return true;
  },
  StateId: STATES.N_FALL_S,
};

const defaultHelpess: condition = {
  Name: 'Helpless',
  ConditionFunc: (w: World) => {
    return true;
  },
  StateId: STATES.HELPESS_S,
};

const LandToIdle: condition = {
  Name: 'LandToIdle',
  ConditionFunc: (w: World, playerIndex) => {
    const ia = w.GetInputManager(playerIndex).GetInputForFrame(w.localFrame)!;

    if (ia.LXAxsis === 0) {
      return true;
    }

    return false;
  },
  StateId: STATES.IDLE_S,
};

const LandToWalk: condition = {
  Name: 'LandToWalk',
  ConditionFunc: (w: World, playerIndex) => {
    const p = w.GetPlayer(playerIndex)!;
    const flags = p.Flags;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;

    if (ia.LXAxsis > 0 && flags.IsFacingRight()) {
      return true;
    }

    if (ia.LXAxsis < 0 && flags.IsFacingLeft()) {
      return true;
    }

    return false;
  },
  StateId: STATES.WALK_S,
};

const LandToTurn: condition = {
  Name: 'LandToTurn',
  ConditionFunc: (w: World, playerIndex) => {
    const p = w.GetPlayer(playerIndex)!;
    const flags = p.Flags;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;

    if (ia.LXAxsis < 0 && flags.IsFacingRight()) {
      return true;
    }

    if (ia.LXAxsis > 0 && flags.IsFacingLeft()) {
      return true;
    }

    return false;
  },
  StateId: STATES.TURN_S,
};

const RunStopToTurn: condition = {
  Name: 'RunStopToTurn',
  ConditionFunc: (w, playerIndex) => {
    const p = w.GetPlayer(playerIndex)!;
    const flags = p.Flags;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;

    if (ia.LXAxsis > 0 && flags.IsFacingLeft()) {
      return true;
    }

    if (ia.LXAxsis < 0 && flags.IsFacingRight()) {
      return true;
    }

    return false;
  },
  StateId: STATES.RUN_TURN_S,
};

// =======================================================

class StateRelation {
  readonly stateId: stateId = STATES.IDLE_S;
  readonly mappings: ActionStateMappings;

  constructor(stateId: stateId, actionStateTranslations: ActionStateMappings) {
    this.stateId = stateId;
    this.mappings = actionStateTranslations;
  }
}

export class ActionStateMappings {
  private readonly mappings = new Map<gameEventId, stateId>();
  private defaultConditions?: Array<condition>;
  private Condtions?: Array<condition>;

  _setMappings(mappingsArray: { geId: gameEventId; sId: stateId }[]) {
    mappingsArray.forEach((actSt) => {
      this.mappings.set(actSt.geId, actSt.sId);
    });
  }

  public getMapping(geId: gameEventId): stateId | undefined {
    return this.mappings.get(geId);
  }

  public getDefaults(): Array<condition> | undefined {
    return this.defaultConditions;
  }

  public GetConditions() {
    return this.Condtions;
  }

  _setDefault(conditions: Array<condition>) {
    if (!this.defaultConditions) {
      this.defaultConditions = conditions;
    }
  }

  _setConditions(conditions: Array<condition>) {
    this.Condtions = conditions;
  }
}

// STATE RELATIONS ===================================================

export const IDLE_STATE_RELATIONS = InitIdleRelations();
export const START_WALK_RELATIONS = InitStartWalkRelations();
export const TURN_RELATIONS = InitTurnWalkRelations();
export const WALK_RELATIONS = InitWalkRelations();
export const DASH_RELATIONS = InitDashRelations();
export const DASH_TURN_RELATIONS = InitDashTurnRelations();
export const RUN_RELATIONS = InitRunRelations();
export const RUN_TURN_RELATIONS = InitRunTurnRelations();
export const STOP_RUN_RELATIONS = InitStopRunRelations();
export const JUMP_SQUAT_RELATIONS = InitJumpSquatRelations();
export const JUMP_RELATIONS = InitJumpRelations();
export const NFALL_RELATIONS = InitNeutralFallRelations();
export const FFALL_RELATIONS = InitFastFallRelations();
export const LAND_RELATIONS = InitLandRelations();
export const SOFT_LAND_RELATIONS = InitSoftLandRelations();
export const LEDGE_GRAB_RELATIONS = InitLedgeGrabRelations();
export const AIR_DODGE_RELATIONS = InitAirDodgeRelations();
export const HELPESS_RELATIONS = InitHelpessRelations();

// ====================================================================

function InitIdleRelations(): StateRelation {
  const idle = new StateRelation(STATES.IDLE_S, InitIdleTranslations());
  return idle;
}

function InitStartWalkRelations(): StateRelation {
  const startWalk = new StateRelation(
    STATES.START_WALK_S,
    InitStartWalkTranslations()
  );

  return startWalk;
}

function InitTurnWalkRelations(): StateRelation {
  const turnWalk = new StateRelation(STATES.TURN_S, InitTurnTranslations());

  return turnWalk;
}

function InitWalkRelations(): StateRelation {
  const walkRelations = new StateRelation(
    STATES.WALK_S,
    InitWalkTranslations()
  );

  return walkRelations;
}

function InitDashRelations(): StateRelation {
  const dashRelations = new StateRelation(
    STATES.DASH_S,
    InitDashTranslations()
  );

  return dashRelations;
}

function InitDashTurnRelations(): StateRelation {
  const dashTurnRelations = new StateRelation(
    STATES.DASH_TURN_S,
    InitDashTrunTranslations()
  );

  return dashTurnRelations;
}

function InitRunRelations(): StateRelation {
  const runRelations = new StateRelation(STATES.RUN_S, InitRunTranslations());

  return runRelations;
}

function InitRunTurnRelations(): StateRelation {
  const runTurnRelations = new StateRelation(
    STATES.RUN_TURN_S,
    InitRunTurnTranslations()
  );

  return runTurnRelations;
}

function InitStopRunRelations(): StateRelation {
  const stopRunRelations = new StateRelation(
    STATES.STOP_RUN_S,
    InitStopRunTranslations()
  );

  return stopRunRelations;
}

function InitJumpSquatRelations(): StateRelation {
  const jumpSquatRelations = new StateRelation(
    STATES.JUMP_SQUAT_S,
    InitJumpSquatTranslations()
  );

  return jumpSquatRelations;
}

function InitJumpRelations(): StateRelation {
  const jumpRelations = new StateRelation(
    STATES.JUMP_S,
    InitJumpTranslations()
  );

  return jumpRelations;
}

function InitNeutralFallRelations(): StateRelation {
  const nFallRelations = new StateRelation(
    STATES.N_FALL_S,
    InitNFallTranslations()
  );

  return nFallRelations;
}

function InitFastFallRelations(): StateRelation {
  const fastFallRelations = new StateRelation(
    STATES.F_FALL_S,
    InitFastFallTranslations()
  );
  return fastFallRelations;
}

function InitLandRelations(): StateRelation {
  const landRelations = new StateRelation(
    STATES.LAND_S,
    InitLandTranslations()
  );

  return landRelations;
}

function InitSoftLandRelations(): StateRelation {
  const softLandRelations = new StateRelation(
    STATES.SOFT_LAND_S,
    InitSoftLandTranslations()
  );

  return softLandRelations;
}

function InitLedgeGrabRelations(): StateRelation {
  const LedgeGrabRelations = new StateRelation(
    STATES.LEDGE_GRAB_S,
    InitLedgeGrabTranslations()
  );

  return LedgeGrabRelations;
}

function InitAirDodgeRelations(): StateRelation {
  const AirDodgeRelations = new StateRelation(
    STATES.AIR_DODGE_S,
    InitAirDodgeTranslations()
  );

  return AirDodgeRelations;
}

function InitHelpessRelations(): StateRelation {
  const HelplessRelations = new StateRelation(
    STATES.HELPESS_S,
    InitHelpessTranslations()
  );

  return HelplessRelations;
}

// ================================================================================

function InitIdleTranslations() {
  const idleTranslations = new ActionStateMappings();
  idleTranslations._setMappings([
    { geId: GAME_EVENTS.MOVE_GE, sId: STATES.START_WALK_S },
    { geId: GAME_EVENTS.MOVE_FAST_GE, sId: STATES.START_WALK_S },
    { geId: GAME_EVENTS.TURN_GE, sId: STATES.TURN_S },
    { geId: GAME_EVENTS.JUMP_GE, sId: STATES.JUMP_SQUAT_S },
    { geId: GAME_EVENTS.FALL_GE, sId: STATES.N_FALL_S },
  ]);

  const condtions: Array<condition> = [IdleToDashturn, IdleToTurn];

  idleTranslations._setConditions(condtions);

  return idleTranslations;
}

function InitStartWalkTranslations(): ActionStateMappings {
  const startWalkTranslations = new ActionStateMappings();
  startWalkTranslations._setMappings([
    { geId: GAME_EVENTS.IDLE_GE, sId: STATES.IDLE_S },
    { geId: GAME_EVENTS.MOVE_FAST_GE, sId: STATES.DASH_S },
    { geId: GAME_EVENTS.JUMP_GE, sId: STATES.JUMP_SQUAT_S },
  ]);

  const conditions: Array<condition> = [WalkToTurn];

  startWalkTranslations._setConditions(conditions);

  const defaultConditions: Array<condition> = [defaultWalk];

  startWalkTranslations._setDefault(defaultConditions);

  return startWalkTranslations;
}

function InitTurnTranslations(): ActionStateMappings {
  const turnTranslations = new ActionStateMappings();
  turnTranslations._setMappings([
    { geId: GAME_EVENTS.JUMP_GE, sId: STATES.JUMP_SQUAT_S },
  ]);

  const defaultConditions: Array<condition> = [TurnDefaultWalk, defaultIdle];

  turnTranslations._setDefault(defaultConditions);

  return turnTranslations;
}

function InitWalkTranslations(): ActionStateMappings {
  const walkTranslations = new ActionStateMappings();
  walkTranslations._setMappings([
    { geId: GAME_EVENTS.IDLE_GE, sId: STATES.IDLE_S },
    { geId: GAME_EVENTS.JUMP_GE, sId: STATES.JUMP_SQUAT_S },
  ]);

  const conditions: Array<condition> = [WalkToTurn];

  walkTranslations._setConditions(conditions);

  return walkTranslations;
}

function InitDashTranslations(): ActionStateMappings {
  const dashTranslations = new ActionStateMappings();
  dashTranslations._setMappings([
    { geId: GAME_EVENTS.JUMP_GE, sId: STATES.JUMP_SQUAT_S },
    { geId: GAME_EVENTS.FALL_GE, sId: STATES.N_FALL_S },
  ]);

  const conditions: Array<condition> = [DashToTurn];

  dashTranslations._setConditions(conditions);

  const defaultConditions: Array<condition> = [DashDefaultRun, DashDefaultIdle];

  dashTranslations._setDefault(defaultConditions);

  return dashTranslations;
}

function InitDashTrunTranslations(): ActionStateMappings {
  const dashTrunTranslations = new ActionStateMappings();
  dashTrunTranslations._setMappings([
    { geId: GAME_EVENTS.JUMP_GE, sId: STATES.JUMP_SQUAT_S },
  ]);

  dashTrunTranslations._setDefault([defaultDash]);

  return dashTrunTranslations;
}

function InitRunTranslations(): ActionStateMappings {
  const runTranslations = new ActionStateMappings();
  runTranslations._setMappings([
    { geId: GAME_EVENTS.JUMP_GE, sId: STATES.JUMP_SQUAT_S },
    { geId: GAME_EVENTS.IDLE_GE, sId: STATES.STOP_RUN_S },
    { geId: GAME_EVENTS.FALL_GE, sId: STATES.N_FALL_S },
  ]);

  const conditions: Array<condition> = [RunToTurn];

  runTranslations._setConditions(conditions);

  return runTranslations;
}

function InitRunTurnTranslations(): ActionStateMappings {
  const runTurnTranslations = new ActionStateMappings();
  runTurnTranslations._setMappings([
    { geId: GAME_EVENTS.JUMP_GE, sId: STATES.JUMP_SQUAT_S },
  ]);

  runTurnTranslations._setDefault([defaultRun]);

  return runTurnTranslations;
}

function InitStopRunTranslations(): ActionStateMappings {
  const stopRunTranslations = new ActionStateMappings();
  stopRunTranslations._setMappings([
    { geId: GAME_EVENTS.MOVE_FAST_GE, sId: STATES.DASH_S },
    { geId: GAME_EVENTS.JUMP_GE, sId: STATES.JUMP_SQUAT_S },
    { geId: GAME_EVENTS.FALL_GE, sId: STATES.N_FALL_S },
    { geId: GAME_EVENTS.TURN_GE, sId: STATES.RUN_TURN_S },
  ]);

  const conditions: Array<condition> = [RunStopToTurn];

  stopRunTranslations._setConditions(conditions);

  stopRunTranslations._setDefault([defaultIdle]);

  return stopRunTranslations;
}

function InitJumpSquatTranslations(): ActionStateMappings {
  const jumpSquatTranslations = new ActionStateMappings();

  jumpSquatTranslations._setDefault([defaultJump]);

  return jumpSquatTranslations;
}

function InitJumpTranslations(): ActionStateMappings {
  const jumpTranslations = new ActionStateMappings();
  const condtions: Array<condition> = [ToJump, ToAirDodge];

  jumpTranslations._setConditions(condtions);
  jumpTranslations._setDefault([defaultNFall]);

  return jumpTranslations;
}

function InitNFallTranslations(): ActionStateMappings {
  const nFallTranslations = new ActionStateMappings();
  nFallTranslations._setMappings([
    { geId: GAME_EVENTS.DOWN_GE, sId: STATES.F_FALL_S },
    { geId: GAME_EVENTS.LAND_GE, sId: STATES.LAND_S },
    { geId: GAME_EVENTS.SOFT_LAND_GE, sId: STATES.SOFT_LAND_S },
    { geId: GAME_EVENTS.LEDGE_GRAB_GE, sId: STATES.LEDGE_GRAB_S },
  ]);

  const condtions: Array<condition> = [ToJump, ToAirDodge];

  nFallTranslations._setConditions(condtions);

  return nFallTranslations;
}

function InitFastFallTranslations(): ActionStateMappings {
  const ffTranslations = new ActionStateMappings();
  ffTranslations._setMappings([
    { geId: GAME_EVENTS.JUMP_GE, sId: STATES.JUMP_S },
    { geId: GAME_EVENTS.LAND_GE, sId: STATES.LAND_S },
    { geId: GAME_EVENTS.SOFT_LAND_GE, sId: STATES.SOFT_LAND_S },
  ]);

  return ffTranslations;
}

function InitLandTranslations(): ActionStateMappings {
  const landTranslations = new ActionStateMappings();

  landTranslations._setDefault([LandToIdle, LandToWalk, LandToTurn]);

  return landTranslations;
}

function InitSoftLandTranslations(): ActionStateMappings {
  const softLandTranslations = new ActionStateMappings();

  softLandTranslations._setDefault([LandToIdle, LandToWalk, LandToTurn]);

  return softLandTranslations;
}

function InitLedgeGrabTranslations(): ActionStateMappings {
  const LedgeGrabTranslations = new ActionStateMappings();
  LedgeGrabTranslations._setMappings([
    { geId: GAME_EVENTS.JUMP_GE, sId: STATES.JUMP_S },
  ]);

  return LedgeGrabTranslations;
}

function InitAirDodgeTranslations(): ActionStateMappings {
  const airDodgeTranslations = new ActionStateMappings();
  airDodgeTranslations._setMappings([
    { geId: GAME_EVENTS.LAND_GE, sId: STATES.LAND_S },
    { geId: GAME_EVENTS.SOFT_LAND_GE, sId: STATES.LAND_S },
  ]);
  airDodgeTranslations._setDefault([defaultHelpess]);

  return airDodgeTranslations;
}

function InitHelpessTranslations(): ActionStateMappings {
  const helpessTranslations = new ActionStateMappings();
  helpessTranslations._setMappings([
    { geId: GAME_EVENTS.LAND_GE, sId: STATES.LAND_S },
    { geId: GAME_EVENTS.SOFT_LAND_GE, sId: STATES.LAND_S },
    { geId: GAME_EVENTS.LEDGE_GRAB_GE, sId: STATES.LEDGE_GRAB_S },
  ]);

  return helpessTranslations;
}

// STATES ==================================================================

export const Idle = {
  StateName: 'IDLE',
  StateId: STATES.IDLE_S,
} as FSMState;

export const StartWalk: FSMState = {
  StateName: 'START_WALK',
  StateId: STATES.START_WALK_S,
  OnEnter: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID);
    const axis = ia?.LXAxsis ?? 0;
    if (ia != undefined) {
      const flags = p.Flags;
      if (axis < 0 && flags.IsFacingRight()) {
        flags.ChangeDirections();
      }
      if (axis > 0 && flags.IsFacingLeft()) {
        flags.ChangeDirections();
      }
    }
  },
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID);
    if (ia != undefined) {
      PlayerHelpers.AddWalkImpulseToPlayer(p, ia.LXAxsis);
    }
  },
  OnExit: (p: Player) => {},
};

export const Walk: FSMState = {
  StateName: 'WALK',
  StateId: STATES.WALK_S,
  OnEnter: (p: Player) => {},
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID);
    if (ia != undefined) {
      PlayerHelpers.AddWalkImpulseToPlayer(p, ia.LXAxsis);
    }
  },
  OnExit: (p: Player) => {},
};

export const Turn: FSMState = {
  StateName: 'TURN',
  StateId: STATES.TURN_S,
  OnEnter: (p: Player) => {},
  OnExit: (p: Player) => {
    p.Flags.ChangeDirections();
  },
};

export const Dash: FSMState = {
  StateName: 'DASH',
  StateId: STATES.DASH_S,
  OnEnter: (p: Player) => {
    const flags = p.Flags;
    const MaxDashSpeed = p.Speeds.MaxDashSpeed;
    const impulse = flags.IsFacingRight()
      ? Math.floor(MaxDashSpeed / 0.33)
      : -Math.floor(MaxDashSpeed / 0.33);

    p.Velocity.AddClampedXImpulse(MaxDashSpeed, impulse);
  },
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID);
    const speedsComp = p.Speeds;
    const dashSpeedMultiplier = speedsComp.DashMultiplier;
    const impulse = (ia?.LXAxsis ?? 0) * dashSpeedMultiplier;
    p.Velocity.AddClampedXImpulse(speedsComp.MaxDashSpeed, impulse);
  },
  OnExit: (p: Player) => {},
};

export const DashTurn: FSMState = {
  StateName: 'DASH_TURN',
  StateId: STATES.DASH_TURN_S,
  OnEnter: (p: Player) => {
    p.Velocity.X = 0;
    p.Flags.ChangeDirections();
  },
  OnUpdate() {},
  OnExit: (p: Player) => {},
};

export const Run: FSMState = {
  StateName: 'RUN',
  StateId: STATES.RUN_S,
  OnEnter: (p: Player) => {},
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID);
    if (ia != undefined) {
      PlayerHelpers.AddRunImpulseToPlayer(p, ia.LXAxsis);
    }
  },
  OnExit: (p: Player) => {},
};

export const RunTurn: FSMState = {
  StateName: 'RUN_TURN',
  StateId: STATES.RUN_TURN_S,
  OnEnter: (p: Player) => {},
  OnUpdate: (p: Player) => {},
  OnExit: (p: Player) => {
    p.Flags.ChangeDirections();
  },
};

export const RunStop: FSMState = {
  StateName: 'RUN_STOP',
  StateId: STATES.STOP_RUN_S,
  OnEnter: (p: Player) => {},
  OnExit: (p: Player) => {},
};

export const JumpSquat: FSMState = {
  StateName: 'JUMPSQUAT',
  StateId: STATES.JUMP_SQUAT_S,
  OnEnter: (p: Player) => {
    console.log('Jump Squat');
  },
  OnExit: (p: Player) => {},
};

export const Jump: FSMState = {
  StateName: 'JUMP',
  StateId: STATES.JUMP_S,
  OnEnter: (p: Player) => {
    const jumpComp = p.Jump;
    if (jumpComp.HasJumps()) {
      PlayerHelpers.AddToPlayerYPosition(p, -0.5);
      p.Velocity.Y = -jumpComp.JumpVelocity;
      jumpComp.IncrementJumps();
    }
  },
  OnUpdate: (p: Player, w: World) => {
    const inputAction = w.GetPlayerCurrentInput(p.ID);
    const speedsComp = p.Speeds;
    p.Velocity.AddClampedXImpulse(
      speedsComp.AerialSpeedInpulseLimit,
      (inputAction?.LXAxsis ?? 0) * speedsComp.ArielVelocityMultiplier
    );
  },
  OnExit: (p: Player) => {},
};

export const NeutralFall: FSMState = {
  StateName: 'NFALL',
  StateId: STATES.N_FALL_S,
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID);
    const speedsComp = p.Speeds;
    p.Velocity.AddClampedXImpulse(
      speedsComp.AerialSpeedInpulseLimit,
      (ia?.LXAxsis ?? 0) * speedsComp.ArielVelocityMultiplier
    );
  },
};

export const FastFall: FSMState = {
  StateName: 'FastFall',
  StateId: STATES.F_FALL_S,
  OnEnter: (p: Player) => {
    p.Flags.FastFallOn();
  },
  OnExit: (p: Player) => {
    p.Flags.FastFallOff();
  },
};

export const Land: FSMState = {
  StateName: 'Land',
  StateId: STATES.LAND_S,
  OnEnter: (p: Player) => {
    p.Jump.ResetJumps();
    p.Velocity.Y = 0;
  },
};

export const SoftLand: FSMState = {
  StateName: 'SoftLand',
  StateId: STATES.SOFT_LAND_S,
  OnEnter: (p: Player) => {
    p.Jump.ResetJumps();
    p.Velocity.Y = 0;
  },
};

export const LedgeGrab: FSMState = {
  StateName: 'LedgeGrab',
  StateId: STATES.LEDGE_GRAB_S,
  OnEnter: (p: Player) => {
    const jumpComp = p.Jump;
    jumpComp.ResetJumps();
    jumpComp.IncrementJumps();
  },
};

export const AirDodge: FSMState = {
  StateName: 'AirDodge',
  StateId: STATES.AIR_DODGE_S,
  OnEnter: (p, w) => {
    const pVel = p.Velocity;
    const ia = w.GetPlayerCurrentInput(p.ID)!;
    const angle = Math.atan2(ia?.LYAxsis, ia?.LXAxsis);
    const speed = p.Speeds.AirDogeSpeed;
    pVel.X = Math.cos(angle) * speed;
    pVel.Y = -Math.sin(angle) * speed;
  },
  OnUpdate: (p, w) => {
    const frameLength = p.StateFrameLengths.GetFrameLengthOrUndefined(
      STATES.AIR_DODGE_S
    )!;
    const currentFrameForState = p.FSMInfo.CurrentStateFrame;
    const normalizedTime = Math.min(currentFrameForState / frameLength, 1);
    const ease = EaseIn(normalizedTime);
    const pVel = p.Velocity;
    pVel.X *= 1 - ease;
    pVel.Y *= 1 - ease;
  },
};

export const Helpess: FSMState = {
  StateName: 'Helpess',
  StateId: STATES.HELPESS_S,
};
