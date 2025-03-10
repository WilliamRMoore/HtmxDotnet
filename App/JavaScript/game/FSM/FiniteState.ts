import { GameEvents } from '../events/events';

// TYPES AND CLASSES ====================================

type gameEventId = number;
type stateId = number;

export const STATES = {
  IDLE: 0 as stateId,
  START_WALK: 1 as stateId,
  TURN: 2 as stateId,
  WALK: 3 as stateId,
  DASH: 4 as stateId,
  DASH_TURN: 5 as stateId,
  STOP_DASH: 6 as stateId,
  STOP_RUN: 7 as stateId,
  RUN_TURN: 8 as stateId,
  STOP_RUN_TURN: 9 as stateId,
  RUN: 10 as stateId,
  JUMPSQUAT: 11 as stateId,
  JUMP: 12 as stateId,
  NFALL: 13 as stateId,
  FFALL: 14 as stateId,
  LAND: 15 as stateId,
  SOFTLAND: 16 as stateId,
};

class StateRelation {
  readonly stateId: stateId = STATES.IDLE;
  readonly mappings: ActionStateMappings;

  constructor(stateId: stateId, actionStateTranslations: ActionStateMappings) {
    this.stateId = stateId;
    this.mappings = actionStateTranslations;
  }
}

class ActionStateMappings {
  private readonly mappings = new Map<gameEventId, stateId>();
  private defaultSate?: stateId;

  _setMappings(mappingsArray: { geId: gameEventId; sId: stateId }[]) {
    mappingsArray.forEach((actSt) => {
      this.mappings.set(actSt.geId, actSt.sId);
    });
  }

  getMapping(geId: gameEventId): stateId | undefined {
    return this.mappings.get(geId);
  }

  getDefault(): stateId | undefined {
    return this.defaultSate;
  }

  _setDefault(stateId: stateId) {
    if (!this.defaultSate) {
      this.defaultSate = stateId;
    }
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
export const RUN_STOP_RELATIONS = InitStopRunRelations();
export const JUMP_SQUAT_RELATIONS = InitJumpSquatRelations();
export const JUMP_RELATIONS = InitJumpRelations();

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
    STATES.JUMPSQUAT,
    InitJumpSquatTranslations()
  );

  return jumpSquatRelations;
}

function InitJumpRelations(): StateRelation {
  const jumpRelations = new StateRelation(STATES.JUMP, InitJumpTranslations());

  return jumpRelations;
}

// ================================================================================

function InitIdleTranslations() {
  const idleTranslations = new ActionStateMappings();
  idleTranslations._setMappings([
    { geId: GameEvents.move, sId: STATES.START_WALK },
    { geId: GameEvents.moveFast, sId: STATES.DASH },
    { geId: GameEvents.turn, sId: STATES.TURN },
    { geId: GameEvents.jump, sId: STATES.JUMPSQUAT },
  ]);

  return idleTranslations;
}

function InitStartWalkTranslations(): ActionStateMappings {
  const startWalkTranslations = new ActionStateMappings();
  startWalkTranslations._setMappings([
    { geId: GameEvents.idle, sId: STATES.IDLE },
    { geId: GameEvents.moveFast, sId: STATES.DASH },
    { geId: GameEvents.jump, sId: STATES.JUMPSQUAT },
  ]);

  startWalkTranslations._setDefault(STATES.WALK);

  return startWalkTranslations;
}

function InitTurnTranslations(): ActionStateMappings {
  const turnTranslations = new ActionStateMappings();
  turnTranslations._setMappings([
    { geId: GameEvents.jump, sId: STATES.JUMPSQUAT },
  ]);

  turnTranslations._setDefault(STATES.IDLE);

  return turnTranslations;
}

function InitWalkTranslations(): ActionStateMappings {
  const walkTranslations = new ActionStateMappings();
  walkTranslations._setMappings([
    { geId: GameEvents.idle, sId: STATES.IDLE },
    { geId: GameEvents.turn, sId: STATES.TURN },
    { geId: GameEvents.jump, sId: STATES.JUMPSQUAT },
  ]);

  return walkTranslations;
}

function InitDashTranslations(): ActionStateMappings {
  const dashTranslations = new ActionStateMappings();
  dashTranslations._setMappings([
    { geId: GameEvents.idle, sId: STATES.STOP_DASH },
    { geId: GameEvents.turn, sId: STATES.DASH_TURN },
    { geId: GameEvents.jump, sId: STATES.JUMPSQUAT },
  ]);

  dashTranslations._setDefault(STATES.RUN);

  return dashTranslations;
}

function InitDashTrunTranslations(): ActionStateMappings {
  const dashTrunTranslations = new ActionStateMappings();
  dashTrunTranslations._setMappings([
    { geId: GameEvents.jump, sId: STATES.JUMPSQUAT },
  ]);

  dashTrunTranslations._setDefault(STATES.DASH);

  return dashTrunTranslations;
}

function InitStopDashTranslations(): ActionStateMappings {
  const stopDashTranslations = new ActionStateMappings();
  stopDashTranslations._setMappings([
    { geId: GameEvents.jump, sId: STATES.JUMPSQUAT },
  ]);

  stopDashTranslations._setDefault(STATES.IDLE);

  return stopDashTranslations;
}

function InitRunTranslations(): ActionStateMappings {
  const runTranslations = new ActionStateMappings();
  runTranslations._setMappings([
    { geId: GameEvents.jump, sId: STATES.JUMPSQUAT },
    { geId: GameEvents.idle, sId: STATES.STOP_RUN },
    { geId: GameEvents.turn, sId: STATES.RUN_TURN },
  ]);

  return runTranslations;
}

function InitRunTurnTranslations(): ActionStateMappings {
  const runTurnTranslations = new ActionStateMappings();
  runTurnTranslations._setMappings([
    { geId: GameEvents.jump, sId: STATES.JUMPSQUAT },
  ]);

  runTurnTranslations._setDefault(STATES.STOP_RUN_TURN);

  return runTurnTranslations;
}

function InitStopRunTranslations(): ActionStateMappings {
  const stopRunTranslations = new ActionStateMappings();
  stopRunTranslations._setMappings([
    { geId: GameEvents.moveFast, sId: STATES.DASH },
    { geId: GameEvents.jump, sId: STATES.JUMPSQUAT },
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

  jumpTranslations._setDefault(STATES.NFALL);

  return jumpTranslations;
}
