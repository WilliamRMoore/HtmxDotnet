import { Player, PlayerHelpers } from '../player/playerOrchestrator';
import { World } from '../world/world';
import { InputAction } from '../../loops/Input';
import { FSMState } from './PlayerStateMachine';

// Aliases =====================================

export type gameEventId = number;
export type stateId = number;

// Constants ===================================

class _GameEvents {
  public readonly upSpecial = 0;
  public readonly downSpecial = 1;
  public readonly sideSpecial = 2;
  public readonly special = 3;
  public readonly upAttack = 4;
  public readonly downAttack = 5;
  public readonly sideAttack = 6;
  public readonly attack = 7;
  public readonly idle = 8;
  public readonly move = 9;
  public readonly moveFast = 10;
  public readonly jump = 11;
  public readonly grab = 12;
  public readonly guard = 13;
  public readonly down = 14;
  public readonly turn = 15;
  // End of GameEvents that can be source from player input
  public readonly land = 16;
  public readonly softLand = 17;
  public readonly fall = 18;
  public readonly ledgeGrab = 19;
}

export const GameEvents = new _GameEvents();

class _STATES {
  public readonly IDLE = 0 as stateId;
  public readonly START_WALK = 1 as stateId;
  public readonly TURN = 2 as stateId;
  public readonly WALK = 3 as stateId;
  public readonly DASH = 4 as stateId;
  public readonly DASH_TURN = 5 as stateId;
  public readonly STOP_RUN = 6 as stateId;
  public readonly RUN_TURN = 7 as stateId;
  public readonly STOP_RUN_TURN = 8 as stateId;
  public readonly RUN = 9 as stateId;
  public readonly JUMP_SQUAT = 10 as stateId;
  public readonly JUMP = 11 as stateId;
  public readonly N_FALL = 12 as stateId;
  public readonly F_FALL = 13 as stateId;
  public readonly LAND = 14 as stateId;
  public readonly SOFT_LAND = 15 as stateId;
  public readonly LEDGE_GRAB = 16 as stateId;
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
    const p = w.GetPlayer(playerIndex);
    const input = w.GetPlayerCurrentInput(playerIndex)!;
    if (p?.FlagsComponent.IsFacingRight() && input.LXAxsis < -0.5) {
      return true;
    }
    if (p?.FlagsComponent.IsFacingLeft() && input.LXAxsis > 0.5) {
      return true;
    }

    return false;
  },
  StateId: STATES.DASH_TURN,
};

const IdleToTurn: condition = {
  Name: 'IdleToTurn',
  ConditionFunc: (w, playerIndex) => {
    const p = w.GetPlayer(playerIndex)!;
    const flags = p.FlagsComponent;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;

    if (flags.IsFacingRight() && ia.LXAxsis < 0) {
      return true;
    }

    if (flags.IsFacingLeft() && ia.LXAxsis > 0) {
      return true;
    }

    return false;
  },
  StateId: STATES.TURN,
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

    const flags = p.FlagsComponent;
    if (
      (prevLax === 0 && flags.IsFacingRight() && curLax < 0) ||
      (prevLax === 0 && flags.IsFacingLeft() && curLax > 0)
    ) {
      return true;
    }

    return false;
  },
  StateId: STATES.TURN,
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

    const flags = p.FlagsComponent;
    if (
      (prevLax === 0 && flags.IsFacingRight() && curLax < 0) ||
      (prevLax === 0 && flags.IsFacingLeft() && curLax > 0)
    ) {
      return true;
    }

    return false;
  },
  StateId: STATES.RUN_TURN,
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

    const flags = p.FlagsComponent;
    // Check if the variation exceeds the threshold and is in the opposite direction of the player's facing direction
    if (flags.IsFacingRight() && laxDifference < -threshold) {
      // Player is facing right, but the stick moved significantly to the left
      if (curLax < 0) {
        return true;
      }
    }

    if (flags.IsFacingLeft() && laxDifference > threshold) {
      // Player is facing left, but the stick moved significantly to the right
      if (curLax > 0) {
        return true;
      }
    }

    return false;
  },
  StateId: STATES.DASH_TURN,
};

const ToJump: condition = {
  Name: 'ToJump',
  ConditionFunc: (w, playerIndex) => {
    const player = w.GetPlayer(playerIndex);
    const currentInput = w.GetPlayerCurrentInput(playerIndex)!;
    const prevInput = w.GetPlayerPreviousInput(playerIndex);

    if (
      currentInput.Action === GameEvents.jump &&
      prevInput?.Action !== GameEvents.jump &&
      player?.JumpComponent.HasJumps()
    ) {
      return true;
    }

    return false;
  },
  StateId: STATES.JUMP,
};

const DashDefaultRun: condition = {
  Name: 'DashDefaultRun',
  ConditionFunc: (w, playerIndex) => {
    const p = w.GetPlayer(playerIndex)!;
    const flags = p.FlagsComponent;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;

    if (flags.IsFacingRight() && ia.LXAxsis > 0) {
      return true;
    }

    if (flags.IsFacingLeft() && ia.LXAxsis < 0) {
      return true;
    }

    return false;
  },
  StateId: STATES.RUN,
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
  StateId: STATES.IDLE,
};

const defaultWalk: condition = {
  Name: 'Walk',
  ConditionFunc: (w: World) => {
    return true;
  },
  StateId: STATES.WALK,
};

const defaultRun: condition = {
  Name: 'Run',
  ConditionFunc: (w: World) => {
    return true;
  },
  StateId: STATES.RUN,
};

const defaultIdle: condition = {
  Name: 'Idle',
  ConditionFunc: (w: World) => {
    return true;
  },
  StateId: STATES.IDLE,
};

const defaultDash: condition = {
  Name: 'Dash',
  ConditionFunc: (w: World) => {
    return true;
  },
  StateId: STATES.DASH,
};

const defaultJump: condition = {
  Name: 'Jump',
  ConditionFunc: (w: World) => {
    return true;
  },
  StateId: STATES.JUMP,
};

const defaultNFall: condition = {
  Name: 'NFall',
  ConditionFunc: (w: World) => {
    return true;
  },
  StateId: STATES.N_FALL,
};

const LandToIdle: condition = {
  Name: 'LandToIdle',
  ConditionFunc: (w: World, playerIndex) => {
    const p = w.GetPlayer(playerIndex)!;
    const ia = w.GetInputManager(playerIndex).GetInputForFrame(w.localFrame)!;

    if (ia.LXAxsis === 0) {
      return true;
    }

    return false;
  },
  StateId: STATES.IDLE,
};

const LandToWalk: condition = {
  Name: 'LandToWalk',
  ConditionFunc: (w: World, playerIndex) => {
    const p = w.GetPlayer(playerIndex)!;
    const flags = p.FlagsComponent;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;

    if (ia.LXAxsis > 0 && flags.IsFacingRight()) {
      return true;
    }

    if (ia.LXAxsis < 0 && flags.IsFacingLeft()) {
      return true;
    }

    return false;
  },
  StateId: STATES.WALK,
};

const LandToTurn: condition = {
  Name: 'LandToTurn',
  ConditionFunc: (w: World, playerIndex) => {
    const p = w.GetPlayer(playerIndex)!;
    const flags = p.FlagsComponent;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;

    if (ia.LXAxsis < 0 && flags.IsFacingRight()) {
      return true;
    }

    if (ia.LXAxsis > 0 && flags.IsFacingLeft()) {
      return true;
    }

    return false;
  },
  StateId: STATES.TURN,
};

const RunStopToTurn: condition = {
  Name: 'RunStopToTurn',
  ConditionFunc: (w, playerIndex) => {
    const p = w.GetPlayer(playerIndex)!;
    const flags = p.FlagsComponent;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;

    if (ia.LXAxsis > 0 && flags.IsFacingLeft()) {
      return true;
    }

    if (ia.LXAxsis < 0 && flags.IsFacingRight()) {
      return true;
    }

    return false;
  },
  StateId: STATES.RUN_TURN,
};

// =======================================================

class StateRelation {
  readonly stateId: stateId = STATES.IDLE;
  readonly mappings: ActionStateMappings;

  constructor(stateId: stateId, actionStateTranslations: ActionStateMappings) {
    this.stateId = stateId;
    this.mappings = actionStateTranslations;
  }
}

export class ActionStateMappings {
  private readonly mappings = new Map<gameEventId, stateId>();
  // private readonly validStates = new Set<stateId>();
  private defaultConditions?: Array<condition>;
  private Condtions?: Array<condition>;

  _setMappings(mappingsArray: { geId: gameEventId; sId: stateId }[]) {
    mappingsArray.forEach((actSt) => {
      this.mappings.set(actSt.geId, actSt.sId);
      //this.validStates.add(actSt.sId);
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

// ====================================================================

function InitIdleRelations(): StateRelation {
  const idle = new StateRelation(STATES.IDLE, InitIdleTranslations());
  return idle;
}

function InitStartWalkRelations(): StateRelation {
  const startWalk = new StateRelation(
    STATES.START_WALK,
    InitStartWalkTranslations()
  );

  return startWalk;
}

function InitTurnWalkRelations(): StateRelation {
  const turnWalk = new StateRelation(STATES.TURN, InitTurnTranslations());

  return turnWalk;
}

function InitWalkRelations(): StateRelation {
  const walkRelations = new StateRelation(STATES.WALK, InitWalkTranslations());

  return walkRelations;
}

function InitDashRelations(): StateRelation {
  const dashRelations = new StateRelation(STATES.DASH, InitDashTranslations());

  return dashRelations;
}

function InitDashTurnRelations(): StateRelation {
  const dashTurnRelations = new StateRelation(
    STATES.DASH_TURN,
    InitDashTrunTranslations()
  );

  return dashTurnRelations;
}

function InitRunRelations(): StateRelation {
  const runRelations = new StateRelation(STATES.RUN, InitRunTranslations());

  return runRelations;
}

function InitRunTurnRelations(): StateRelation {
  const runTurnRelations = new StateRelation(
    STATES.RUN_TURN,
    InitRunTurnTranslations()
  );

  return runTurnRelations;
}

function InitStopRunRelations(): StateRelation {
  const stopRunRelations = new StateRelation(
    STATES.STOP_RUN,
    InitStopRunTranslations()
  );

  return stopRunRelations;
}

function InitJumpSquatRelations(): StateRelation {
  const jumpSquatRelations = new StateRelation(
    STATES.JUMP_SQUAT,
    InitJumpSquatTranslations()
  );

  return jumpSquatRelations;
}

function InitJumpRelations(): StateRelation {
  const jumpRelations = new StateRelation(STATES.JUMP, InitJumpTranslations());

  return jumpRelations;
}

function InitNeutralFallRelations(): StateRelation {
  const nFallRelations = new StateRelation(
    STATES.N_FALL,
    InitNFallTranslations()
  );

  return nFallRelations;
}

function InitFastFallRelations(): StateRelation {
  const fastFallRelations = new StateRelation(
    STATES.F_FALL,
    InitFastFallTranslations()
  );
  return fastFallRelations;
}

function InitLandRelations(): StateRelation {
  const landRelations = new StateRelation(STATES.LAND, InitLandTranslations());

  return landRelations;
}

function InitSoftLandRelations(): StateRelation {
  const softLandRelations = new StateRelation(
    STATES.SOFT_LAND,
    InitSoftLandTranslations()
  );

  return softLandRelations;
}

function InitLedgeGrabRelations(): StateRelation {
  const LedgeGrabRelations = new StateRelation(
    STATES.LEDGE_GRAB,
    InitLedgeGrabTranslations()
  );

  return LedgeGrabRelations;
}

// ================================================================================

function InitIdleTranslations() {
  const idleTranslations = new ActionStateMappings();
  idleTranslations._setMappings([
    { geId: GameEvents.move, sId: STATES.START_WALK },
    { geId: GameEvents.moveFast, sId: STATES.START_WALK },
    { geId: GameEvents.turn, sId: STATES.TURN },
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
    { geId: GameEvents.fall, sId: STATES.N_FALL },
  ]);

  const condtions: Array<condition> = [IdleToDashturn, IdleToTurn];

  idleTranslations._setConditions(condtions);

  return idleTranslations;
}

function InitStartWalkTranslations(): ActionStateMappings {
  const startWalkTranslations = new ActionStateMappings();
  startWalkTranslations._setMappings([
    { geId: GameEvents.idle, sId: STATES.IDLE },
    { geId: GameEvents.moveFast, sId: STATES.DASH },
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
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
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
  ]);

  const defaultConditions: Array<condition> = [defaultIdle];

  turnTranslations._setDefault(defaultConditions);

  return turnTranslations;
}

function InitWalkTranslations(): ActionStateMappings {
  const walkTranslations = new ActionStateMappings();
  walkTranslations._setMappings([
    { geId: GameEvents.idle, sId: STATES.IDLE },
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
  ]);

  const conditions: Array<condition> = [WalkToTurn];

  walkTranslations._setConditions(conditions);

  return walkTranslations;
}

function InitDashTranslations(): ActionStateMappings {
  const dashTranslations = new ActionStateMappings();
  dashTranslations._setMappings([
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
    { geId: GameEvents.fall, sId: STATES.N_FALL },
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
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
  ]);

  dashTrunTranslations._setDefault([defaultDash]);

  return dashTrunTranslations;
}

function InitStopDashTranslations(): ActionStateMappings {
  const stopDashTranslations = new ActionStateMappings();
  stopDashTranslations._setMappings([
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
    { geId: GameEvents.fall, sId: STATES.N_FALL },
  ]);

  stopDashTranslations._setDefault([defaultIdle]);

  return stopDashTranslations;
}

function InitRunTranslations(): ActionStateMappings {
  const runTranslations = new ActionStateMappings();
  runTranslations._setMappings([
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
    { geId: GameEvents.idle, sId: STATES.STOP_RUN },
    { geId: GameEvents.fall, sId: STATES.N_FALL },
  ]);

  const conditions: Array<condition> = [RunToTurn];

  runTranslations._setConditions(conditions);

  return runTranslations;
}

function InitRunTurnTranslations(): ActionStateMappings {
  const runTurnTranslations = new ActionStateMappings();
  runTurnTranslations._setMappings([
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
  ]);

  runTurnTranslations._setDefault([defaultRun]);

  return runTurnTranslations;
}

function InitStopRunTranslations(): ActionStateMappings {
  const stopRunTranslations = new ActionStateMappings();
  stopRunTranslations._setMappings([
    { geId: GameEvents.moveFast, sId: STATES.DASH },
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
    { geId: GameEvents.fall, sId: STATES.N_FALL },
    { geId: GameEvents.turn, sId: STATES.RUN_TURN },
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
  const condtions: Array<condition> = [ToJump];

  jumpTranslations._setConditions(condtions);
  jumpTranslations._setDefault([defaultNFall]);

  return jumpTranslations;
}

function InitNFallTranslations(): ActionStateMappings {
  const nFallTranslations = new ActionStateMappings();
  nFallTranslations._setMappings([
    { geId: GameEvents.down, sId: STATES.F_FALL },
    { geId: GameEvents.land, sId: STATES.LAND },
    { geId: GameEvents.softLand, sId: STATES.SOFT_LAND },
    { geId: GameEvents.ledgeGrab, sId: STATES.LEDGE_GRAB },
  ]);

  const condtions: Array<condition> = [ToJump];

  nFallTranslations._setConditions(condtions);

  return nFallTranslations;
}

function InitFastFallTranslations(): ActionStateMappings {
  const ffTranslations = new ActionStateMappings();
  ffTranslations._setMappings([
    { geId: GameEvents.jump, sId: STATES.JUMP },
    { geId: GameEvents.land, sId: STATES.LAND },
    { geId: GameEvents.softLand, sId: STATES.SOFT_LAND },
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
    { geId: GameEvents.jump, sId: STATES.JUMP },
  ]);

  return LedgeGrabTranslations;
}

// STATES ==================================================================

export const Idle = {
  StateName: 'IDLE',
  StateId: STATES.IDLE,
} as FSMState;

export const StartWalk: FSMState = {
  StateName: 'START_WALK',
  StateId: STATES.START_WALK,
  FrameLength: 5,
  OnEnter: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID);
    if (ia != undefined) {
      const flags = p.FlagsComponent;
      if (flags.IsFacingRight() && ia!.LXAxsis < 0) {
        flags.ChangeDirections();
      }
      if (flags.IsFacingLeft() && ia!.LXAxsis > 0) {
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
  OnExit: (p: Player) => {
    console.log('Exit Start Walk');
  },
};

export const Walk: FSMState = {
  StateName: 'WALK',
  StateId: STATES.WALK,
  OnEnter: (p: Player) => {
    console.log('Walk');
  },
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID);
    if (ia != undefined) {
      PlayerHelpers.AddWalkImpulseToPlayer(p, ia.LXAxsis);
    }
  },
  OnExit: (p: Player) => {
    console.log('Exit Walk');
  },
};

export const Turn: FSMState = {
  StateName: 'TURN',
  StateId: STATES.TURN,
  FrameLength: 4,
  OnEnter: (p: Player) => {
    console.log('Turn');
  },
  OnExit: (p: Player) => {
    p.FlagsComponent.ChangeDirections();
  },
};

export const Dash: FSMState = {
  StateName: 'DASH',
  StateId: STATES.DASH,
  FrameLength: 20,
  OnEnter: (p: Player) => {
    console.log('Dash');
    const flags = p.FlagsComponent;
    const MaxDashSpeed = p.SpeedsComponent.MaxDashSpeed;
    const impulse = flags.IsFacingRight()
      ? Math.floor(MaxDashSpeed / 0.33)
      : -Math.floor(MaxDashSpeed / 0.33);

    p.VelocityComponent.AddClampedXImpulse(MaxDashSpeed, impulse);
  },
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID);
    const dashSpeedMultiplier = p.SpeedsComponent.DashMultiplier;
    const impulse = (ia?.LXAxsis ?? 0) * dashSpeedMultiplier;
    p.VelocityComponent.AddClampedXImpulse(
      p.SpeedsComponent.MaxDashSpeed,
      impulse!
    );
  },
  OnExit: (p: Player) => {
    console.log('Exit Dash');
  },
};

export const DashTurn: FSMState = {
  StateName: 'DASH_TURN',
  StateId: STATES.DASH_TURN,
  FrameLength: 1,
  OnEnter: (p: Player) => {
    console.log('Dash Turn');
    p.VelocityComponent.X = 0;
    p.FlagsComponent.ChangeDirections();
  },
  OnUpdate() {
    console.log('Dash Turn Update');
  },
  OnExit: (p: Player) => {
    console.log('Exit Dash Turn');
  },
};

export const Run: FSMState = {
  StateName: 'RUN',
  StateId: STATES.RUN,
  OnEnter: (p: Player) => {
    console.log('Run');
  },
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID);
    if (ia != undefined) {
      PlayerHelpers.AddRunImpulseToPlayer(p, ia.LXAxsis);
    }
  },
  OnExit: (p: Player) => {
    console.log('Exit Run');
  },
};

export const RunTurn: FSMState = {
  StateName: 'RUN_TURN',
  StateId: STATES.RUN_TURN,
  FrameLength: 20,
  OnEnter: (p: Player) => {
    console.log('Run Turn');
  },
  OnUpdate: (p: Player) => {},
  OnExit: (p: Player) => {
    p.FlagsComponent.ChangeDirections();
    console.log('Exit Run Turn');
  },
};

export const RunStop: FSMState = {
  StateName: 'RUN_STOP',
  StateId: STATES.STOP_RUN,
  FrameLength: 15,
  OnEnter: (p: Player) => {
    console.log('Run Stop');
  },
  OnExit: (p: Player) => {
    console.log('Exit Run Stop');
  },
};

export const JumpSquat: FSMState = {
  StateName: 'JUMPSQUAT',
  StateId: STATES.JUMP_SQUAT,
  FrameLength: 4,
  OnEnter: (p: Player) => {
    console.log('Jump Squat');
  },
  OnExit: (p: Player) => {
    console.log('Exit Jump Squat');
  },
};

export const Jump: FSMState = {
  StateName: 'JUMP',
  StateId: STATES.JUMP,
  FrameLength: 15,
  OnEnter: (p: Player) => {
    if (p.JumpComponent.HasJumps()) {
      //p.AddToPlayerYPosition(-0.5);
      PlayerHelpers.AddToPlayerYPosition(p, -0.5);
      p.VelocityComponent.Y = -p.JumpComponent.JumpVelocity;
      console.log('Jump');
      p.JumpComponent.IncrementJumps();
    }
  },
  OnUpdate: (p: Player, w: World) => {
    const inputAction = w.GetPlayerCurrentInput(p.ID);
    p.VelocityComponent.AddClampedXImpulse(
      p.SpeedsComponent.AerialSpeedInpulseLimit,
      inputAction?.LXAxsis ?? 0
    );
  },
  OnExit: (p: Player) => {
    console.log('Exit Jump');
  },
};

export const NeutralFall: FSMState = {
  StateName: 'NFALL',
  StateId: STATES.N_FALL,
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID);
    p.VelocityComponent.AddClampedXImpulse(
      p.SpeedsComponent.AerialSpeedInpulseLimit,
      (ia?.LXAxsis ?? 0) * 2
    );
  },
};

export const FastFall: FSMState = {
  StateName: 'FastFall',
  StateId: STATES.F_FALL,
  OnEnter: (p: Player) => {
    p.FlagsComponent.FastFallOn();
  },
  OnExit: (p: Player) => {
    p.FlagsComponent.FastFallOff();
  },
};

export const Land: FSMState = {
  FrameLength: 3,
  StateName: 'Land',
  StateId: STATES.LAND,
  OnEnter: (p: Player) => {
    p.JumpComponent.ResetJumps();
    p.VelocityComponent.Y = 0;
  },
};

export const SoftLand: FSMState = {
  StateName: 'SoftLand',
  StateId: STATES.SOFT_LAND,
  FrameLength: 1,
  OnEnter: (p: Player) => {
    p.JumpComponent.ResetJumps();
    p.VelocityComponent.Y = 0;
  },
};

export const LedgeGrab: FSMState = {
  StateName: 'LedgeGrab',
  StateId: STATES.LEDGE_GRAB,
  OnEnter: (p: Player) => {
    p.JumpComponent.ResetJumps();
    p.JumpComponent.IncrementJumps();
  },
};
