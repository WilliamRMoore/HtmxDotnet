import { World } from '../engine/world/world';

//Conditional functions =================================================
type condition = {
  Name: string;
  ConditionFunc: conditionFunc;
};

type conditionFunc = (world: World) => stateId | undefined;

const IdleToTurn: conditionFunc = (world: World) => {
  const p = world.Player!;
  const ia = world.GetInputManager(0).GetInputForFrame(world.localFrame)!;

  if (p.IsFacingRight() && ia.LXAxsis < 0) {
    return STATES.TURN;
  }

  if (p.IsFacingLeft() && ia.LXAxsis > 0) {
    return STATES.TURN;
  }

  return undefined;
};

const WalkToTurn: conditionFunc = (world: World) => {
  const p = world.Player!;
  const ia = world.GetInputManager(p.ID).GetInputForFrame(world.localFrame)!;
  const prevIa = world.GetPlayerPreviousInput(p.ID);

  if (prevIa === undefined) {
    return undefined;
  }

  const prevLax = prevIa.LXAxsis;
  const curLax = ia.LXAxsis;
  if ((prevLax < 0 && curLax > 0) || (prevLax > 0 && curLax < 0)) {
    return STATES.TURN;
  }

  if (
    (prevLax === 0 && p.IsFacingRight() && curLax < 0) ||
    (prevLax === 0 && p.IsFacingLeft() && curLax > 0)
  ) {
    return STATES.TURN;
  }

  return undefined;
};

const RuntToTurn: conditionFunc = (world: World) => {
  const p = world.Player!;
  const ia = world.GetInputManager(p.ID).GetInputForFrame(world.localFrame)!;
  const prevIa = world.GetPlayerPreviousInput(p.ID);

  if (prevIa == undefined) {
    return undefined;
  }

  const prevLax = prevIa.LXAxsis;
  const curLax = ia.LXAxsis;

  if ((prevLax < 0 && curLax > 0) || (prevLax > 0 && curLax < 0)) {
    return STATES.RUN_TURN;
  }

  if (
    (prevLax === 0 && p.IsFacingRight() && curLax < 0) ||
    (prevLax === 0 && p.IsFacingLeft() && curLax > 0)
  ) {
    return STATES.RUN_TURN;
  }

  return undefined;
};

const DashToTurn: conditionFunc = (world: World) => {
  const p = world.Player!;
  const ia = world.GetInputManager(p.ID).GetInputForFrame(world.localFrame)!;
  const prevIa = world.GetPlayerPreviousInput(p.ID);

  if (prevIa === undefined) {
    return undefined;
  }
  const prevLax = prevIa.LXAxsis;
  const curLax = ia.LXAxsis;

  if (
    (prevLax == 0 && p.IsFacingRight() && curLax < 0) ||
    (prevLax == 0 && p.IsFacingLeft() && curLax > 0)
  ) {
    return STATES.DASH_TURN;
  }

  return undefined;
};

// TYPES AND CLASSES ====================================

export type gameEventId = number;
export type stateId = number;

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
  public readonly dashTurn = 16;
  public readonly land = 17;
  public readonly softLand = 18;
}

export const GameEvents = new _GameEvents();
class _STATES {
  public readonly IDLE = 0 as stateId;
  public readonly START_WALK = 1 as stateId;
  public readonly TURN = 2 as stateId;
  public readonly WALK = 3 as stateId;
  public readonly DASH = 4 as stateId;
  public readonly DASH_TURN = 5 as stateId;
  public readonly STOP_DASH = 6 as stateId;
  public readonly STOP_RUN = 7 as stateId;
  public readonly RUN_TURN = 8 as stateId;
  public readonly STOP_RUN_TURN = 9 as stateId;
  public readonly RUN = 10 as stateId;
  public readonly JUMP_SQUAT = 11 as stateId;
  public readonly JUMP = 12 as stateId;
  public readonly N_FALL = 13 as stateId;
  public readonly F_FALL = 14 as stateId;
  public readonly LAND = 15 as stateId;
  public readonly SOFT_LAND = 16 as stateId;
}

export const STATES = new _STATES();

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
  private defaultSate?: stateId;
  private Condtions?: Array<condition>;

  _setMappings(mappingsArray: { geId: gameEventId; sId: stateId }[]) {
    mappingsArray.forEach((actSt) => {
      this.mappings.set(actSt.geId, actSt.sId);
    });
  }

  public getMapping(geId: gameEventId): stateId | undefined {
    return this.mappings.get(geId);
  }

  public getDefault(): stateId | undefined {
    return this.defaultSate;
  }

  public GetConditions() {
    return this.Condtions;
  }

  _setDefault(stateId: stateId) {
    if (!this.defaultSate) {
      this.defaultSate = stateId;
    }
  }

  _setConditions(conditions: Array<condition>) {
    this.Condtions = conditions;
  }
}

type stateConfig = {
  onEnter?: () => void;
  onUpdate?: () => void;
  onExit?: () => void;
};

// export class FSMState {
//   readonly stateId: stateId;
//   readonly stateName: string;
//   readonly stateFrameLength?: number = undefined;
//   readonly interuptFrame?: number = undefined;
//   onEnter?: () => void;
//   onUpdate?: () => void;
//   onExit?: () => void;

//   constructor(
//     stateId: stateId,
//     stateName: string,
//     config: stateConfig,
//     stateFrameLength: number | undefined = undefined,
//     interuptFrame: number | undefined = undefined
//   ) {
//     this.stateFrameLength = stateFrameLength;
//     this.interuptFrame = interuptFrame;
//     this.stateName = stateName;
//     this.stateId = stateId;
//     this.onEnter = config.onEnter;
//     this.onExit = config.onExit;
//     this.onUpdate = config.onUpdate;
//   }

//   canInterupt(currentFrame: number): boolean {
//     if (this.interuptFrame == undefined) {
//       return true;
//     }

//     if (currentFrame >= this.interuptFrame) {
//       return true;
//     }

//     return false;
//   }
// }

// STATE RELATIONS ===================================================

export const IDLE_STATE_RELATIONS = InitIdleRelations();
export const START_WALK_RELATIONS = InitStartWalkRelations();
export const TURN_RELATIONS = InitTurnWalkRelations();
export const WALK_RELATIONS = InitWalkRelations();
export const DASH_RELATIONS = InitDashRelations();
export const DASH_TURN_RELATIONS = InitDashTurnRelations();
export const STOP_DASH_RELATIONS = InitStopDashRelations();
export const RUN_RELATIONS = InitRunRelations();
export const RUN_TURN_RELATIONS = InitRunTurnRelations();
export const STOP_RUN_RELATIONS = InitStopRunRelations();
export const JUMP_SQUAT_RELATIONS = InitJumpSquatRelations();
export const JUMP_RELATIONS = InitJumpRelations();
export const NFALL_RELATIONS = InitNeutralFallRelations();
export const FFALL_RELATIONS = InitFastFallRelations();
export const LAND_RELATIONS = InitLandRelations();
export const SOFT_LAND_RELATIONS = InitSoftLandRelations();

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

function InitStopDashRelations(): StateRelation {
  const stopDashRelations = new StateRelation(
    STATES.STOP_DASH,
    InitStopDashTranslations()
  );

  return stopDashRelations;
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
  const softLandTranslations = new StateRelation(
    STATES.SOFT_LAND,
    InitSoftLandTranslations()
  );

  return softLandTranslations;
}

// ================================================================================

function InitIdleTranslations() {
  const idleTranslations = new ActionStateMappings();
  idleTranslations._setMappings([
    { geId: GameEvents.move, sId: STATES.START_WALK },
    { geId: GameEvents.moveFast, sId: STATES.DASH },
    { geId: GameEvents.turn, sId: STATES.TURN },
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
  ]);

  const condtions: Array<condition> = [
    { Name: 'IdleToTurn', ConditionFunc: IdleToTurn },
  ];

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

  const conditions: Array<condition> = [
    { Name: 'WalkToTurn', ConditionFunc: WalkToTurn },
  ];

  startWalkTranslations._setConditions(conditions);

  startWalkTranslations._setDefault(STATES.WALK);

  return startWalkTranslations;
}

function InitTurnTranslations(): ActionStateMappings {
  const turnTranslations = new ActionStateMappings();
  turnTranslations._setMappings([
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
  ]);

  turnTranslations._setDefault(STATES.IDLE);

  return turnTranslations;
}

function InitWalkTranslations(): ActionStateMappings {
  const walkTranslations = new ActionStateMappings();
  walkTranslations._setMappings([
    { geId: GameEvents.idle, sId: STATES.IDLE },
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
  ]);

  const conditions: Array<condition> = [
    { Name: 'WalkToRun', ConditionFunc: WalkToTurn },
  ];

  walkTranslations._setConditions(conditions);

  return walkTranslations;
}

function InitDashTranslations(): ActionStateMappings {
  const dashTranslations = new ActionStateMappings();
  dashTranslations._setMappings([
    { geId: GameEvents.idle, sId: STATES.STOP_DASH },
    { geId: GameEvents.turn, sId: STATES.DASH_TURN },
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
  ]);

  const conditions: Array<condition> = [
    { Name: 'DashToRun', ConditionFunc: DashToTurn },
  ];

  dashTranslations._setConditions(conditions);

  dashTranslations._setDefault(STATES.RUN);

  return dashTranslations;
}

function InitDashTrunTranslations(): ActionStateMappings {
  const dashTrunTranslations = new ActionStateMappings();
  dashTrunTranslations._setMappings([
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
  ]);

  dashTrunTranslations._setDefault(STATES.DASH);

  return dashTrunTranslations;
}

function InitStopDashTranslations(): ActionStateMappings {
  const stopDashTranslations = new ActionStateMappings();
  stopDashTranslations._setMappings([
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
  ]);

  stopDashTranslations._setDefault(STATES.IDLE);

  return stopDashTranslations;
}

function InitRunTranslations(): ActionStateMappings {
  const runTranslations = new ActionStateMappings();
  runTranslations._setMappings([
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
    { geId: GameEvents.idle, sId: STATES.STOP_RUN },
  ]);

  const conditions: Array<condition> = [
    { Name: 'RunToTurn', ConditionFunc: RuntToTurn },
  ];

  runTranslations._setConditions(conditions);

  return runTranslations;
}

function InitRunTurnTranslations(): ActionStateMappings {
  const runTurnTranslations = new ActionStateMappings();
  runTurnTranslations._setMappings([
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
  ]);

  runTurnTranslations._setDefault(STATES.RUN);

  return runTurnTranslations;
}

function InitStopRunTranslations(): ActionStateMappings {
  const stopRunTranslations = new ActionStateMappings();
  stopRunTranslations._setMappings([
    { geId: GameEvents.moveFast, sId: STATES.DASH },
    { geId: GameEvents.jump, sId: STATES.JUMP_SQUAT },
  ]);

  stopRunTranslations._setDefault(STATES.IDLE);

  return stopRunTranslations;
}

function InitJumpSquatTranslations(): ActionStateMappings {
  const jumpSquatTranslations = new ActionStateMappings();

  jumpSquatTranslations._setDefault(STATES.JUMP);

  return jumpSquatTranslations;
}

function InitJumpTranslations(): ActionStateMappings {
  const jumpTranslations = new ActionStateMappings();
  jumpTranslations._setMappings([{ geId: GameEvents.jump, sId: STATES.JUMP }]);

  jumpTranslations._setDefault(STATES.N_FALL);

  return jumpTranslations;
}

function InitNFallTranslations(): ActionStateMappings {
  const nFallTranslations = new ActionStateMappings();
  nFallTranslations._setMappings([
    { geId: GameEvents.jump, sId: STATES.JUMP },
    { geId: GameEvents.down, sId: STATES.F_FALL },
    { geId: GameEvents.land, sId: STATES.LAND },
    { geId: GameEvents.softLand, sId: STATES.SOFT_LAND },
  ]);

  return nFallTranslations;
}

function InitFastFallTranslations(): ActionStateMappings {
  const ffTranslations = new ActionStateMappings();
  ffTranslations._setMappings([{ geId: GameEvents.jump, sId: STATES.JUMP }]);

  return ffTranslations;
}

function InitLandTranslations(): ActionStateMappings {
  const landTranslations = new ActionStateMappings();
  landTranslations._setDefault(STATES.IDLE);

  return landTranslations;
}

function InitSoftLandTranslations(): ActionStateMappings {
  const softLandTranslations = new ActionStateMappings();
  softLandTranslations._setDefault(STATES.IDLE);

  return softLandTranslations;
}
