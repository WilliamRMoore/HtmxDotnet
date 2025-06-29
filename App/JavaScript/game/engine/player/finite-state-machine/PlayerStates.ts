import { Player } from '../playerOrchestrator';
import { EaseIn, Sequencer } from '../../utils';
import { World } from '../../world/world';
import { FSMState } from './PlayerStateMachine';

// Aliases =========================================================================

export type GameEventId = number;
export type StateId = number;
export type AttackId = number;

// Constants =======================================================================

const seq = new Sequencer();

//Postfixed with _GE for game event. So you know you are looking at game event Ids.
class GameEvents {
  public readonly UP_SPECIAL_GE = seq.Next as GameEventId;
  public readonly DOWN_SPECIAL_GE = seq.Next as GameEventId;
  public readonly SIDE_SPECIAL_GE = seq.Next as GameEventId;
  public readonly SPECIAL_GE = seq.Next as GameEventId;
  public readonly UP_ATTACK_GE = seq.Next as GameEventId;
  public readonly DOWN_ATTACK_GE = seq.Next as GameEventId;
  public readonly SIDE_ATTACK_GE = seq.Next as GameEventId;
  public readonly ATTACK_GE = seq.Next as GameEventId;
  public readonly N_AIR_GE = seq.Next as GameEventId;
  public readonly F_AIR_GE = seq.Next as GameEventId;
  public readonly B_AIR_GE = seq.Next as GameEventId;
  public readonly U_AIR_GE = seq.Next as GameEventId;
  public readonly D_AIR_GE = seq.Next as GameEventId;
  public readonly IDLE_GE = seq.Next as GameEventId;
  public readonly MOVE_GE = seq.Next as GameEventId;
  public readonly MOVE_FAST_GE = seq.Next as GameEventId;
  public readonly JUMP_GE = seq.Next as GameEventId;
  public readonly GRAB_GE = seq.Next as GameEventId;
  public readonly GUARD_GE = seq.Next as GameEventId;
  public readonly DOWN_GE = seq.Next as GameEventId;
  public readonly TURN_GE = seq.Next as GameEventId;
  // End of GameEvents that can be source from player input
  public readonly LAND_GE = seq.Next as GameEventId;
  public readonly SOFT_LAND_GE = seq.Next as GameEventId;
  public readonly FALL_GE = seq.Next as GameEventId;
  public readonly LEDGE_GRAB_GE = seq.Next as GameEventId;
  public readonly HIT_STOP_GE = seq.Next as GameEventId;
  public readonly LAUNCH_GE = seq.Next as GameEventId;
  public readonly TUBMLE_GE = seq.Next as GameEventId;
}

export const GAME_EVENT_IDS = new GameEvents();

seq.SeqStart = 0;

//Postfixed _S for state, so you know you are looking at state Ids.
class STATES {
  public readonly IDLE_S = seq.Next as StateId;
  public readonly START_WALK_S = seq.Next as StateId;
  public readonly TURN_S = seq.Next as StateId;
  public readonly WALK_S = seq.Next as StateId;
  public readonly DASH_S = seq.Next as StateId;
  public readonly DASH_TURN_S = seq.Next as StateId;
  public readonly STOP_RUN_S = seq.Next as StateId;
  public readonly RUN_TURN_S = seq.Next as StateId;
  public readonly STOP_RUN_TURN_S = seq.Next as StateId;
  public readonly RUN_S = seq.Next as StateId;
  public readonly JUMP_SQUAT_S = seq.Next as StateId;
  public readonly JUMP_S = seq.Next as StateId;
  public readonly N_FALL_S = seq.Next as StateId;
  public readonly LAND_S = seq.Next as StateId;
  public readonly SOFT_LAND_S = seq.Next as StateId;
  public readonly LEDGE_GRAB_S = seq.Next as StateId;
  public readonly AIR_DODGE_S = seq.Next as StateId;
  public readonly HELPESS_S = seq.Next as StateId;
  public readonly ATTACK_S = seq.Next as StateId;
  public readonly N_AIR_S = seq.Next as StateId;
  public readonly F_AIR_S = seq.Next as StateId;
  public readonly B_AIR_S = seq.Next as StateId;
  public readonly U_AIR_S = seq.Next as StateId;
  public readonly D_AIR_S = seq.Next as StateId;
  public readonly DOWN_SPECIAL_S = seq.Next as StateId;
  public readonly HIT_STOP_S = seq.Next as StateId;
  public readonly LAUNCH_S = seq.Next as StateId;
  public readonly TUMBLE_S = seq.Next as StateId;
  public readonly CROUCH_S = seq.Next as StateId;
}

export const STATE_IDS = new STATES();

seq.SeqStart = 0;

class ATTACKS {
  public readonly NUETRAL_ATTACK = seq.Next as AttackId;
  public readonly SIDE_ATTACK = seq.Next as AttackId;
  public readonly UP_ATTACK = seq.Next as AttackId;
  public readonly DOWN_ATTACK = seq.Next as AttackId;
  public readonly SIDE_TILT = seq.Next as AttackId;
  public readonly UP_TILT = seq.Next as AttackId;
  public readonly DOWN_TILT = seq.Next as AttackId;
  public readonly N_AIR_ATTACK = seq.Next as AttackId;
  public readonly F_AIR_ATTACK = seq.Next as AttackId;
  public readonly B_AIR_ATTACK = seq.Next as AttackId;
  public readonly U_AIR_ATTACK = seq.Next as AttackId;
  public readonly D_AIR_ATTACK = seq.Next as AttackId;
  public readonly NUETRAL_SPECIAL = seq.Next as StateId;
  public readonly SIDE_SPECIAL = seq.Next as StateId;
  public readonly UP_SPECAIL = seq.Next as StateId;
  public readonly DOWN_SPECIAL = seq.Next as AttackId;
}

export const ATTACK_IDS = new ATTACKS();

// State mapping classes ===========================================================

class StateRelation {
  readonly stateId: StateId;
  readonly mappings: ActionStateMappings;

  constructor(stateId: StateId, actionStateTranslations: ActionStateMappings) {
    this.stateId = stateId;
    this.mappings = actionStateTranslations;
  }
}

export class ActionStateMappings {
  private readonly mappings = new Map<GameEventId, StateId>();
  private defaultConditions?: Array<condition>;
  private condtions?: Array<condition>;

  public GetMapping(geId: GameEventId): StateId | undefined {
    return this.mappings.get(geId);
  }

  public GetDefaults(): Array<condition> | undefined {
    return this.defaultConditions;
  }

  public GetConditions() {
    return this.condtions;
  }

  public get HasDefaults(): boolean {
    return this.defaultConditions !== undefined;
  }

  public get HasConditions(): boolean {
    return this.condtions !== undefined;
  }

  public get HasDirectMappings(): boolean {
    return this.mappings.size > 0;
  }

  _setMappings(mappingsArray: { geId: GameEventId; sId: StateId }[]) {
    mappingsArray.forEach((actSt) => {
      this.mappings.set(actSt.geId, actSt.sId);
    });
  }

  _setDefault(conditions: Array<condition>) {
    if (!this.defaultConditions) {
      this.defaultConditions = conditions;
    }
  }

  _setConditions(conditions: Array<condition>) {
    this.condtions = conditions;
  }
}

// Conditionals ====================================================================

type conditionFunc = (world: World, playerIndex: number) => boolean;

type condition = {
  Name: string;
  ConditionFunc: conditionFunc;
  StateId: StateId;
};

type attackCondition = {
  Name: string;
  ConditionFunc: conditionFunc;
  AttackId: AttackId;
};

export function RunCondition(
  c: condition,
  w: World,
  playerIndex: number
): StateId | undefined {
  if (c.ConditionFunc(w, playerIndex)) {
    return c.StateId;
  }
  return undefined;
}

export function RunAttackCondition(
  c: attackCondition,
  w: World,
  playerIndex: number
): AttackId | undefined {
  if (c.ConditionFunc(w, playerIndex)) {
    return c.AttackId;
  }

  return undefined;
}

const IdleToDashturn: condition = {
  Name: 'IdleToTurnDash',
  ConditionFunc: (w: World, playerIndex: number) => {
    const p = w.GetPlayer(playerIndex)!;
    const input = w.GetPlayerCurrentInput(playerIndex)!;
    if (input.LXAxsis < -0.5 && p.Flags.IsFacingRight) {
      return true;
    }
    if (input.LXAxsis > 0.5 && p.Flags.IsFacingLeft) {
      return true;
    }

    return false;
  },
  StateId: STATE_IDS.DASH_TURN_S,
};

const IdleToTurn: condition = {
  Name: 'IdleToTurn',
  ConditionFunc: (w: World, playerIndex: number) => {
    const p = w.GetPlayer(playerIndex)!;
    const flags = p.Flags;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;

    if (ia.LXAxsis < 0 && flags.IsFacingRight) {
      return true;
    }

    if (ia.LXAxsis > 0 && flags.IsFacingLeft) {
      return true;
    }

    return false;
  },
  StateId: STATE_IDS.TURN_S,
};

const WalkToTurn: condition = {
  Name: 'WalkToTurn',
  ConditionFunc: (w: World, playerIndex: number) => {
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
      (prevLax === 0 && flags.IsFacingRight && curLax < 0) ||
      (prevLax === 0 && flags.IsFacingLeft && curLax > 0)
    ) {
      return true;
    }

    return false;
  },
  StateId: STATE_IDS.TURN_S,
};

const RunToTurn: condition = {
  Name: 'RunToTurn',
  ConditionFunc: (w: World, playerIndex: number) => {
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
      (prevLax === 0 && flags.IsFacingRight && curLax < 0) ||
      (prevLax === 0 && flags.IsFacingLeft && curLax > 0)
    ) {
      return true;
    }

    return false;
  },
  StateId: STATE_IDS.RUN_TURN_S,
};

const DashToTurn: condition = {
  Name: 'DashToTurn',
  ConditionFunc: (w: World, playerIndex: number) => {
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
    const facingRight = flags.IsFacingRight;
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
  StateId: STATE_IDS.DASH_TURN_S,
};

const ToJump: condition = {
  Name: 'ToJump',
  ConditionFunc: (w: World, playerIndex: number) => {
    const player = w.GetPlayer(playerIndex);
    const currentInput = w.GetPlayerCurrentInput(playerIndex)!;
    const prevInput = w.GetPlayerPreviousInput(playerIndex);
    const jumpId = GAME_EVENT_IDS.JUMP_GE;

    if (
      currentInput.Action === jumpId &&
      prevInput?.Action !== jumpId &&
      player?.Jump.HasJumps()
    ) {
      return true;
    }

    return false;
  },
  StateId: STATE_IDS.JUMP_S,
};

const ToAirDodge: condition = {
  Name: 'ToAirDodge',
  ConditionFunc: (w: World, playerIndex: number) => {
    const currentInput = w.GetPlayerCurrentInput(playerIndex);
    if (currentInput?.Action == GAME_EVENT_IDS.GUARD_GE) {
      return true;
    }
    return false;
  },
  StateId: STATE_IDS.AIR_DODGE_S,
};

const DashDefaultRun: condition = {
  Name: 'DashDefaultRun',
  ConditionFunc: (w: World, playerIndex: number) => {
    const p = w.GetPlayer(playerIndex)!;
    const flags = p.Flags;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;

    if (ia.LXAxsis > 0 && flags.IsFacingRight) {
      return true;
    }

    if (ia.LXAxsis < 0 && flags.IsFacingLeft) {
      return true;
    }

    return false;
  },
  StateId: STATE_IDS.RUN_S,
};

const DashDefaultIdle: condition = {
  Name: 'DashDefaultIdle',
  ConditionFunc: (w: World, playerIndex: number) => {
    const ia = w.GetPlayerCurrentInput(playerIndex)!;

    if (ia.LXAxsis === 0) {
      return true;
    }

    return false;
  },
  StateId: STATE_IDS.IDLE_S,
};

const TurnDefaultWalk: condition = {
  Name: 'TurnDefaultWalk',
  ConditionFunc: (w: World, playerIndex: number) => {
    const ia = w.GetPlayerCurrentInput(playerIndex);
    const p = w.GetPlayer(playerIndex);
    const facingRight = p?.Flags.IsFacingRight;

    if ((facingRight && ia!.LXAxsis < 0) || (!facingRight && ia!.LXAxsis > 0)) {
      return true;
    }
    return false;
  },
  StateId: STATE_IDS.WALK_S,
};

const TurnToDash: condition = {
  Name: 'TurnToDash',
  ConditionFunc: (w: World, playerIndex: number) => {
    const p = w.GetPlayer(playerIndex)!;
    const stateFrame = p.FSMInfo.CurrentStateFrame;

    if (stateFrame > 2) {
      return false;
    }

    const input = w.GetPlayerCurrentInput(playerIndex)!;

    if (input.LXAxsis < -0.5 && p.Flags.IsFacingRight) {
      return true;
    }

    if (input.LXAxsis > 0.5 && p.Flags.IsFacingLeft) {
      return true;
    }

    return false;
  },
  StateId: STATE_IDS.DASH_S,
};

const LandToJumpSquat: condition = {
  Name: 'LandToJumpSquat',
  ConditionFunc: (w: World, playerIndex: number) => {
    const ia = w.GetPlayerCurrentInput(playerIndex);
    const prevIa = w.GetPlayerPreviousInput(playerIndex);
    const p = w.GetPlayer(playerIndex);
    const stateFrame = p!.FSMInfo.CurrentStateFrame;

    if (stateFrame > 1) {
      return false;
    }

    if (ia?.Action !== GAME_EVENT_IDS.JUMP_GE) {
      return false;
    }

    if (prevIa === null) {
      return true;
    }

    if (prevIa?.Action === GAME_EVENT_IDS.JUMP_GE) {
      return false;
    }

    return true;
  },
  StateId: STATE_IDS.JUMP_SQUAT_S,
};

const defaultWalk: condition = {
  Name: 'Walk',
  ConditionFunc: (w: World, playerIndex: number) => {
    return true;
  },
  StateId: STATE_IDS.WALK_S,
};

const defaultRun: condition = {
  Name: 'Run',
  ConditionFunc: (w: World, playerIndex: number) => {
    return true;
  },
  StateId: STATE_IDS.RUN_S,
};

const defaultIdle: condition = {
  Name: 'Idle',
  ConditionFunc: (w: World, playerIndex: number) => {
    return true;
  },
  StateId: STATE_IDS.IDLE_S,
};

const defaultDash: condition = {
  Name: 'Dash',
  ConditionFunc: (w: World, playerIndex: number) => {
    return true;
  },
  StateId: STATE_IDS.DASH_S,
};

const defaultJump: condition = {
  Name: 'Jump',
  ConditionFunc: (w: World, playerIndex: number) => {
    return true;
  },
  StateId: STATE_IDS.JUMP_S,
};

const defaultNFall: condition = {
  Name: 'NFall',
  ConditionFunc: (w: World, playerIndex: number) => {
    return true;
  },
  StateId: STATE_IDS.N_FALL_S,
};

const defaultHelpess: condition = {
  Name: 'Helpless',
  ConditionFunc: (w: World, playerIndex: number) => {
    return true;
  },
  StateId: STATE_IDS.HELPESS_S,
};

const LandToIdle: condition = {
  Name: 'LandToIdle',
  ConditionFunc: (w: World, playerIndex: number) => {
    const ia = w.GetInputManager(playerIndex).GetInputForFrame(w.localFrame)!;

    if (ia.LXAxsis === 0) {
      return true;
    }

    return false;
  },
  StateId: STATE_IDS.IDLE_S,
};

const LandToWalk: condition = {
  Name: 'LandToWalk',
  ConditionFunc: (w: World, playerIndex: number) => {
    const p = w.GetPlayer(playerIndex)!;
    const flags = p.Flags;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;

    if (ia.LXAxsis > 0 && flags.IsFacingRight) {
      return true;
    }

    if (ia.LXAxsis < 0 && flags.IsFacingLeft) {
      return true;
    }

    return false;
  },
  StateId: STATE_IDS.WALK_S,
};

const LandToTurn: condition = {
  Name: 'LandToTurn',
  ConditionFunc: (w: World, playerIndex: number) => {
    const p = w.GetPlayer(playerIndex)!;
    const flags = p.Flags;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;

    if (ia.LXAxsis < 0 && flags.IsFacingRight) {
      return true;
    }

    if (ia.LXAxsis > 0 && flags.IsFacingLeft) {
      return true;
    }

    return false;
  },
  StateId: STATE_IDS.TURN_S,
};

const RunStopToTurn: condition = {
  Name: 'RunStopToTurn',
  ConditionFunc: (w: World, playerIndex: number) => {
    const p = w.GetPlayer(playerIndex)!;
    const flags = p.Flags;
    const ia = w.GetPlayerCurrentInput(playerIndex)!;

    if (ia.LXAxsis > 0 && flags.IsFacingLeft) {
      return true;
    }

    if (ia.LXAxsis < 0 && flags.IsFacingRight) {
      return true;
    }

    return false;
  },
  StateId: STATE_IDS.RUN_TURN_S,
};

const IdleToAttack: condition = {
  Name: 'IdleToAttack',
  ConditionFunc: (w: World, playerIndex: number) => {
    const ia = w.GetPlayerCurrentInput(playerIndex);
    const lastIa = w.GetPlayerPreviousInput(playerIndex);

    if (
      ia!.Action === GAME_EVENT_IDS.ATTACK_GE &&
      lastIa!.Action != GAME_EVENT_IDS.ATTACK_GE
    ) {
      return true;
    }

    return false;
  },
  StateId: STATE_IDS.ATTACK_S,
};

const ToDownSpecial: condition = {
  Name: 'IdleToDownSpecial',
  ConditionFunc: (w: World, playerIndex: number) => {
    const ia = w.GetPlayerCurrentInput(playerIndex);
    const lastIa = w.GetPlayerPreviousInput(playerIndex);

    if (
      ia!.Action === GAME_EVENT_IDS.DOWN_SPECIAL_GE &&
      (lastIa?.Action === undefined ||
        lastIa!.Action !== GAME_EVENT_IDS.DOWN_SPECIAL_GE)
    ) {
      return true;
    }

    return false;
  },
  StateId: STATE_IDS.DOWN_SPECIAL_S,
};

const HitStopToLaunch: condition = {
  Name: 'HitStopToLaunch',
  ConditionFunc: (w: World, playerIndex: number) => {
    const p = w.GetPlayer(playerIndex)!;

    if (p.HitStop.HitStopFrames > 0) {
      return false;
    }

    return true;
  },
  StateId: STATE_IDS.LAUNCH_S,
};

const LaunchToTumble: condition = {
  Name: 'LaunchToHitStun',
  ConditionFunc: (w: World, playerIndex: number) => {
    const p = w.GetPlayer(playerIndex)!;

    if (p.HitStun.FramesOfHitStun > 0) {
      return false;
    }

    return true;
  },
  StateId: STATE_IDS.TUMBLE_S,
};

// Attack Conditionals =================================================================

const attackToNeutral: attackCondition = {
  Name: 'AttackToNurtal',
  ConditionFunc: (w: World, playerIndex: number) => {
    const ia = w.GetPlayerCurrentInput(playerIndex)!;
    const p = w.GetPlayer(playerIndex)!;
    const grounded = p.IsPlayerGroundedOnStage(w.Stage);

    if (ia?.Action === GAME_EVENT_IDS.ATTACK_GE && grounded) {
      return true;
    }

    return false;
  },
  AttackId: ATTACK_IDS.NUETRAL_ATTACK,
};

export const AttackDecisions = [attackToNeutral];

const toNuetralAir: attackCondition = {
  Name: 'ToNeutralAir',
  ConditionFunc: (w: World, playerIndex: number) => {
    return true;
  },
  AttackId: ATTACK_IDS.N_AIR_ATTACK,
};

export const NeutralAirConditions = [toNuetralAir];

const downSpecialToDownSpecialGrounded: attackCondition = {
  Name: 'DownSpecialToDownSpeacialGrounded',
  ConditionFunc: (w: World, playerIndex: number) => {
    const ia = w.GetPlayerCurrentInput(playerIndex)!;
    const p = w.GetPlayer(playerIndex)!;
    const grounded = p.IsPlayerGroundedOnStage(w.Stage!);

    if (ia.Action === GAME_EVENT_IDS.DOWN_SPECIAL_GE && grounded) {
      return true;
    }
    return false;
  },
  AttackId: ATTACK_IDS.DOWN_SPECIAL,
};

export const DownSpecialConditions = [downSpecialToDownSpecialGrounded];

// StateMapping init functions ====================================================================

function InitIdleRelations(): StateRelation {
  const idleTranslations = new ActionStateMappings();

  idleTranslations._setMappings([
    { geId: GAME_EVENT_IDS.MOVE_GE, sId: STATE_IDS.START_WALK_S },
    { geId: GAME_EVENT_IDS.MOVE_FAST_GE, sId: STATE_IDS.START_WALK_S },
    { geId: GAME_EVENT_IDS.TURN_GE, sId: STATE_IDS.TURN_S },
    { geId: GAME_EVENT_IDS.JUMP_GE, sId: STATE_IDS.JUMP_SQUAT_S },
    { geId: GAME_EVENT_IDS.FALL_GE, sId: STATE_IDS.N_FALL_S },
    { geId: GAME_EVENT_IDS.HIT_STOP_GE, sId: STATE_IDS.HIT_STOP_S },
    { geId: GAME_EVENT_IDS.DOWN_GE, sId: STATE_IDS.CROUCH_S },
  ]);

  const condtions: Array<condition> = [
    IdleToDashturn,
    IdleToTurn,
    IdleToAttack,
    ToDownSpecial,
  ];

  idleTranslations._setConditions(condtions);

  const idle = new StateRelation(STATE_IDS.IDLE_S, idleTranslations);
  return idle;
}

function InitStartWalkRelations(): StateRelation {
  const startWalkTranslations = new ActionStateMappings();

  startWalkTranslations._setMappings([
    { geId: GAME_EVENT_IDS.IDLE_GE, sId: STATE_IDS.IDLE_S },
    { geId: GAME_EVENT_IDS.MOVE_FAST_GE, sId: STATE_IDS.DASH_S },
    { geId: GAME_EVENT_IDS.JUMP_GE, sId: STATE_IDS.JUMP_SQUAT_S },
    { geId: GAME_EVENT_IDS.HIT_STOP_GE, sId: STATE_IDS.HIT_STOP_S },
  ]);

  const conditions: Array<condition> = [WalkToTurn];

  startWalkTranslations._setConditions(conditions);

  const defaultConditions: Array<condition> = [defaultWalk];

  startWalkTranslations._setDefault(defaultConditions);

  const startWalk = new StateRelation(
    STATE_IDS.START_WALK_S,
    startWalkTranslations
  );

  return startWalk;
}

function InitTurnRelations(): StateRelation {
  const turnTranslations = new ActionStateMappings();

  turnTranslations._setMappings([
    { geId: GAME_EVENT_IDS.JUMP_GE, sId: STATE_IDS.JUMP_SQUAT_S },
    { geId: GAME_EVENT_IDS.HIT_STOP_GE, sId: STATE_IDS.HIT_STOP_S },
  ]);

  const defaultConditions: Array<condition> = [TurnDefaultWalk, defaultIdle];

  turnTranslations._setConditions([TurnToDash]);

  turnTranslations._setDefault(defaultConditions);

  const turnWalk = new StateRelation(STATE_IDS.TURN_S, turnTranslations);

  return turnWalk;
}

function InitWalkRelations(): StateRelation {
  const walkTranslations = new ActionStateMappings();

  walkTranslations._setMappings([
    { geId: GAME_EVENT_IDS.IDLE_GE, sId: STATE_IDS.IDLE_S },
    { geId: GAME_EVENT_IDS.JUMP_GE, sId: STATE_IDS.JUMP_SQUAT_S },
    { geId: GAME_EVENT_IDS.HIT_STOP_GE, sId: STATE_IDS.HIT_STOP_S },
    { geId: GAME_EVENT_IDS.DOWN_GE, sId: STATE_IDS.CROUCH_S },
  ]);

  const conditions: Array<condition> = [WalkToTurn];

  walkTranslations._setConditions(conditions);

  const walkRelations = new StateRelation(STATE_IDS.WALK_S, walkTranslations);

  return walkRelations;
}

function InitDashRelations(): StateRelation {
  const dashTranslations = new ActionStateMappings();

  dashTranslations._setMappings([
    { geId: GAME_EVENT_IDS.JUMP_GE, sId: STATE_IDS.JUMP_SQUAT_S },
    { geId: GAME_EVENT_IDS.FALL_GE, sId: STATE_IDS.N_FALL_S },
    { geId: GAME_EVENT_IDS.HIT_STOP_GE, sId: STATE_IDS.HIT_STOP_S },
  ]);

  const conditions: Array<condition> = [DashToTurn];

  dashTranslations._setConditions(conditions);

  const defaultConditions: Array<condition> = [DashDefaultRun, DashDefaultIdle];

  dashTranslations._setDefault(defaultConditions);

  const dashRelations = new StateRelation(STATE_IDS.DASH_S, dashTranslations);

  return dashRelations;
}

function InitDashTurnRelations(): StateRelation {
  const dashTrunTranslations = new ActionStateMappings();

  dashTrunTranslations._setMappings([
    { geId: GAME_EVENT_IDS.JUMP_GE, sId: STATE_IDS.JUMP_SQUAT_S },
    { geId: GAME_EVENT_IDS.HIT_STOP_GE, sId: STATE_IDS.HIT_STOP_S },
  ]);

  dashTrunTranslations._setDefault([defaultDash]);

  const dashTurnRelations = new StateRelation(
    STATE_IDS.DASH_TURN_S,
    dashTrunTranslations
  );

  return dashTurnRelations;
}

function InitRunRelations(): StateRelation {
  const runTranslations = new ActionStateMappings();

  runTranslations._setMappings([
    { geId: GAME_EVENT_IDS.JUMP_GE, sId: STATE_IDS.JUMP_SQUAT_S },
    { geId: GAME_EVENT_IDS.IDLE_GE, sId: STATE_IDS.STOP_RUN_S },
    { geId: GAME_EVENT_IDS.FALL_GE, sId: STATE_IDS.N_FALL_S },
    { geId: GAME_EVENT_IDS.HIT_STOP_GE, sId: STATE_IDS.HIT_STOP_S },
    { geId: GAME_EVENT_IDS.DOWN_GE, sId: STATE_IDS.CROUCH_S },
  ]);

  const conditions: Array<condition> = [RunToTurn];

  runTranslations._setConditions(conditions);

  const runRelations = new StateRelation(STATE_IDS.RUN_S, runTranslations);

  return runRelations;
}

function InitRunTurnRelations(): StateRelation {
  const runTurnMapping = new ActionStateMappings();

  runTurnMapping._setMappings([
    { geId: GAME_EVENT_IDS.JUMP_GE, sId: STATE_IDS.JUMP_SQUAT_S },
    { geId: GAME_EVENT_IDS.HIT_STOP_GE, sId: STATE_IDS.HIT_STOP_S },
  ]);

  runTurnMapping._setDefault([defaultRun]);

  const runTurnRelations = new StateRelation(
    STATE_IDS.RUN_TURN_S,
    runTurnMapping
  );

  return runTurnRelations;
}

function InitStopRunRelations(): StateRelation {
  const stopRunTranslations = new ActionStateMappings();

  stopRunTranslations._setMappings([
    { geId: GAME_EVENT_IDS.MOVE_FAST_GE, sId: STATE_IDS.DASH_S },
    { geId: GAME_EVENT_IDS.JUMP_GE, sId: STATE_IDS.JUMP_SQUAT_S },
    { geId: GAME_EVENT_IDS.FALL_GE, sId: STATE_IDS.N_FALL_S },
    { geId: GAME_EVENT_IDS.TURN_GE, sId: STATE_IDS.RUN_TURN_S },
    { geId: GAME_EVENT_IDS.HIT_STOP_GE, sId: STATE_IDS.HIT_STOP_S },
    { geId: GAME_EVENT_IDS.DOWN_GE, sId: STATE_IDS.CROUCH_S },
  ]);

  const conditions: Array<condition> = [RunStopToTurn];

  stopRunTranslations._setConditions(conditions);

  stopRunTranslations._setDefault([defaultIdle]);

  const stopRunRelations = new StateRelation(
    STATE_IDS.STOP_RUN_S,
    stopRunTranslations
  );

  return stopRunRelations;
}

function InitJumpSquatRelations(): StateRelation {
  const jumpSquatTranslations = new ActionStateMappings();

  jumpSquatTranslations._setMappings([
    { geId: GAME_EVENT_IDS.HIT_STOP_GE, sId: STATE_IDS.HIT_STOP_S },
  ]);

  jumpSquatTranslations._setDefault([defaultJump]);

  const jumpSquatRelations = new StateRelation(
    STATE_IDS.JUMP_SQUAT_S,
    jumpSquatTranslations
  );

  return jumpSquatRelations;
}

function InitJumpRelations(): StateRelation {
  const jumpTranslations = new ActionStateMappings();

  jumpTranslations._setMappings([
    { geId: GAME_EVENT_IDS.HIT_STOP_GE, sId: STATE_IDS.HIT_STOP_S },
  ]);

  const condtions: Array<condition> = [ToJump, ToAirDodge];

  jumpTranslations._setConditions(condtions);

  jumpTranslations._setDefault([defaultNFall]);

  const jumpRelations = new StateRelation(STATE_IDS.JUMP_S, jumpTranslations);

  return jumpRelations;
}

function InitNeutralFallRelations(): StateRelation {
  const nFallTranslations = new ActionStateMappings();

  nFallTranslations._setMappings([
    { geId: GAME_EVENT_IDS.LAND_GE, sId: STATE_IDS.LAND_S },
    { geId: GAME_EVENT_IDS.SOFT_LAND_GE, sId: STATE_IDS.SOFT_LAND_S },
    { geId: GAME_EVENT_IDS.LEDGE_GRAB_GE, sId: STATE_IDS.LEDGE_GRAB_S },
    { geId: GAME_EVENT_IDS.HIT_STOP_GE, sId: STATE_IDS.HIT_STOP_S },
    { geId: GAME_EVENT_IDS.N_AIR_GE, sId: STATE_IDS.N_AIR_S },
    { geId: GAME_EVENT_IDS.F_AIR_GE, sId: STATE_IDS.F_AIR_S },
    { geId: GAME_EVENT_IDS.U_AIR_GE, sId: STATE_IDS.U_AIR_S },
    { geId: GAME_EVENT_IDS.B_AIR_GE, sId: STATE_IDS.B_AIR_S },
    { geId: GAME_EVENT_IDS.D_AIR_GE, sId: STATE_IDS.D_AIR_S },
  ]);

  const condtions: Array<condition> = [ToJump, ToAirDodge];

  nFallTranslations._setConditions(condtions);

  const nFallRelations = new StateRelation(
    STATE_IDS.N_FALL_S,
    nFallTranslations
  );

  return nFallRelations;
}

function InitLandRelations(): StateRelation {
  const landTranslations = new ActionStateMappings();

  landTranslations._setMappings([
    { geId: GAME_EVENT_IDS.HIT_STOP_GE, sId: STATE_IDS.HIT_STOP_S },
  ]);

  landTranslations._setDefault([LandToIdle, LandToWalk, LandToTurn]);

  const landRelations = new StateRelation(STATE_IDS.LAND_S, landTranslations);

  return landRelations;
}

function InitSoftLandRelations(): StateRelation {
  const softLandTranslations = new ActionStateMappings();

  softLandTranslations._setDefault([LandToIdle, LandToWalk, LandToTurn]);

  const softLandRelations = new StateRelation(
    STATE_IDS.SOFT_LAND_S,
    softLandTranslations
  );

  return softLandRelations;
}

function InitLedgeGrabRelations(): StateRelation {
  const LedgeGrabTranslations = new ActionStateMappings();

  LedgeGrabTranslations._setMappings([
    { geId: GAME_EVENT_IDS.JUMP_GE, sId: STATE_IDS.JUMP_S },
  ]);

  const LedgeGrabRelations = new StateRelation(
    STATE_IDS.LEDGE_GRAB_S,
    LedgeGrabTranslations
  );

  return LedgeGrabRelations;
}

function InitAirDodgeRelations(): StateRelation {
  const airDodgeTranslations = new ActionStateMappings();

  airDodgeTranslations._setMappings([
    { geId: GAME_EVENT_IDS.LAND_GE, sId: STATE_IDS.LAND_S },
    { geId: GAME_EVENT_IDS.SOFT_LAND_GE, sId: STATE_IDS.LAND_S },
  ]);

  airDodgeTranslations._setDefault([defaultHelpess]);

  const AirDodgeRelations = new StateRelation(
    STATE_IDS.AIR_DODGE_S,
    airDodgeTranslations
  );

  return AirDodgeRelations;
}

function InitHelpessRelations(): StateRelation {
  const helpessTranslations = new ActionStateMappings();

  helpessTranslations._setMappings([
    { geId: GAME_EVENT_IDS.LAND_GE, sId: STATE_IDS.LAND_S },
    { geId: GAME_EVENT_IDS.SOFT_LAND_GE, sId: STATE_IDS.LAND_S },
    { geId: GAME_EVENT_IDS.LEDGE_GRAB_GE, sId: STATE_IDS.LEDGE_GRAB_S },
  ]);

  const HelplessRelations = new StateRelation(
    STATE_IDS.HELPESS_S,
    helpessTranslations
  );

  return HelplessRelations;
}

function InitAttackRelations(): StateRelation {
  const attackTranslations = new ActionStateMappings();

  attackTranslations._setDefault([defaultIdle]);

  const attackRelations = new StateRelation(
    STATE_IDS.ATTACK_S,
    attackTranslations
  );

  return attackRelations;
}

function InitAirAttackRelations(): StateRelation {
  const airAttackTranslations = new ActionStateMappings();

  airAttackTranslations._setDefault([defaultNFall]);

  airAttackTranslations._setMappings([
    { geId: GAME_EVENT_IDS.LAND_GE, sId: STATE_IDS.LAND_S },
    { geId: GAME_EVENT_IDS.SOFT_LAND_GE, sId: STATE_IDS.SOFT_LAND_S },
    { geId: GAME_EVENT_IDS.LEDGE_GRAB_GE, sId: STATE_IDS.LEDGE_GRAB_S },
  ]);

  const airAttackRelations = new StateRelation(
    STATE_IDS.N_AIR_S,
    airAttackTranslations
  );

  return airAttackRelations;
}

function InitFAirAttackRelations(): StateRelation {
  const fAirAttackTranslations = new ActionStateMappings();

  fAirAttackTranslations._setDefault([defaultNFall]);

  fAirAttackTranslations._setMappings([
    { geId: GAME_EVENT_IDS.SOFT_LAND_GE, sId: STATE_IDS.SOFT_LAND_S },
    { geId: GAME_EVENT_IDS.LAND_GE, sId: STATE_IDS.LAND_S },
    { geId: GAME_EVENT_IDS.LEDGE_GRAB_GE, sId: STATE_IDS.LEDGE_GRAB_S },
  ]);

  const fAirTranslations = new StateRelation(
    STATE_IDS.F_AIR_S,
    fAirAttackTranslations
  );

  return fAirTranslations;
}

function InitUAirRelations(): StateRelation {
  const uAirTranslations = new ActionStateMappings();

  uAirTranslations._setMappings([
    { geId: GAME_EVENT_IDS.LAND_GE, sId: STATE_IDS.LAND_S },
    { geId: GAME_EVENT_IDS.SOFT_LAND_GE, sId: STATE_IDS.SOFT_LAND_S },
    { geId: GAME_EVENT_IDS.LEDGE_GRAB_GE, sId: STATE_IDS.LEDGE_GRAB_S },
  ]);

  uAirTranslations._setDefault([defaultNFall]);

  const uAirRelations = new StateRelation(STATE_IDS.U_AIR_S, uAirTranslations);

  return uAirRelations;
}

function InitBAirRelations(): StateRelation {
  const bAirTranslations = new ActionStateMappings();

  bAirTranslations._setMappings([
    { geId: GAME_EVENT_IDS.LAND_GE, sId: STATE_IDS.LAND_S },
    { geId: GAME_EVENT_IDS.SOFT_LAND_GE, sId: STATE_IDS.SOFT_LAND_S },
    { geId: GAME_EVENT_IDS.LEDGE_GRAB_GE, sId: STATE_IDS.LEDGE_GRAB_S },
  ]);

  bAirTranslations._setDefault([defaultNFall]);

  const bAirRelations = new StateRelation(STATE_IDS.B_AIR_S, bAirTranslations);

  return bAirRelations;
}

function InitDAirRelations(): StateRelation {
  const dAirTranslations = new ActionStateMappings();

  dAirTranslations._setMappings([
    { geId: GAME_EVENT_IDS.LAND_GE, sId: STATE_IDS.LAND_S },
    { geId: GAME_EVENT_IDS.SOFT_LAND_GE, sId: STATE_IDS.SOFT_LAND_S },
    { geId: GAME_EVENT_IDS.LEDGE_GRAB_GE, sId: STATE_IDS.LEDGE_GRAB_S },
  ]);

  dAirTranslations._setDefault([defaultNFall]);

  const bAirRelations = new StateRelation(STATE_IDS.D_AIR_S, dAirTranslations);

  return bAirRelations;
}

function InitDownSpecialRelations(): StateRelation {
  const downSpecialTranslations = new ActionStateMappings();

  downSpecialTranslations._setDefault([defaultIdle]);

  const downSpecRelations = new StateRelation(
    STATE_IDS.DOWN_SPECIAL_S,
    downSpecialTranslations
  );

  return downSpecRelations;
}

function InitHitStopRelations(): StateRelation {
  const hitStopTranslations = new ActionStateMappings();

  const hitStopConditions = [HitStopToLaunch];

  hitStopTranslations._setConditions(hitStopConditions);

  const hitStunRelations = new StateRelation(
    STATE_IDS.HIT_STOP_S,
    hitStopTranslations
  );

  return hitStunRelations;
}

function InitTumbleRelations(): StateRelation {
  const TumbleTranslations = new ActionStateMappings();

  TumbleTranslations._setMappings([
    { geId: GAME_EVENT_IDS.LAND_GE, sId: STATE_IDS.LAND_S },
    { geId: GAME_EVENT_IDS.SOFT_LAND_GE, sId: STATE_IDS.LAND_S },
  ]);

  TumbleTranslations._setConditions([ToJump]);

  const TumbleRelations = new StateRelation(
    STATE_IDS.TUMBLE_S,
    TumbleTranslations
  );

  return TumbleRelations;
}

function InitLaunchRelations(): StateRelation {
  const launchTranslations = new ActionStateMappings();

  launchTranslations._setConditions([LaunchToTumble]);

  const launchRelations = new StateRelation(
    STATE_IDS.LAUNCH_S,
    launchTranslations
  );

  return launchRelations;
}

function InitCrouchRelations(): StateRelation {
  const crouchTranslations = new ActionStateMappings();

  crouchTranslations._setMappings([
    { geId: GAME_EVENT_IDS.IDLE_GE, sId: STATE_IDS.IDLE_S },
    { geId: GAME_EVENT_IDS.HIT_STOP_GE, sId: STATE_IDS.HIT_STOP_S },
    { geId: GAME_EVENT_IDS.MOVE_GE, sId: STATE_IDS.START_WALK_S },
    { geId: GAME_EVENT_IDS.MOVE_FAST_GE, sId: STATE_IDS.START_WALK_S },
    { geId: GAME_EVENT_IDS.JUMP_GE, sId: STATE_IDS.JUMP_SQUAT_S },
  ]);

  crouchTranslations._setConditions([ToDownSpecial]);

  const crouchRelations = new StateRelation(
    STATE_IDS.CROUCH_S,
    crouchTranslations
  );

  return crouchRelations;
}

// STATES ==================================================================

export const Idle: FSMState = {
  StateName: 'IDLE',
  StateId: STATE_IDS.IDLE_S,
  OnEnter: (p: Player, w: World) => {
    p.Flags.SetCanWalkOffFalse();
  },
  OnUpdate: (p: Player, w: World) => {},
  OnExit: (p: Player, w: World) => {
    p.Flags.SetCanWalkOffTrue();
  },
};

export const StartWalk: FSMState = {
  StateName: 'START_WALK',
  StateId: STATE_IDS.START_WALK_S,
  OnEnter: (p: Player, w: World) => {
    p.Flags.SetCanWalkOffFalse();
    const ia = w.GetPlayerCurrentInput(p.ID);
    const axis = ia?.LXAxsis ?? 0;
    if (ia !== undefined) {
      const flags = p.Flags;
      if (axis < 0 && flags.IsFacingRight) {
        flags.ChangeDirections();
      }
      if (axis > 0 && flags.IsFacingLeft) {
        flags.ChangeDirections();
      }
    }
  },
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID);
    if (ia !== undefined) {
      p.AddWalkImpulseToPlayer(ia.LXAxsis);
    }
  },
  OnExit: (p: Player, w: World) => {
    p.Flags.SetCanWalkOffTrue();
  },
};

export const Walk: FSMState = {
  StateName: 'WALK',
  StateId: STATE_IDS.WALK_S,
  OnEnter: (p: Player, w: World) => {
    p.Flags.SetCanWalkOffFalse();
  },
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID);
    if (ia !== undefined) {
      p.AddWalkImpulseToPlayer(ia.LXAxsis);
    }
  },
  OnExit: (p: Player, w: World) => {
    p.Flags.SetCanWalkOffTrue();
  },
};

export const Turn: FSMState = {
  StateName: 'TURN',
  StateId: STATE_IDS.TURN_S,
  OnEnter: (p: Player, W: World) => {},
  OnUpdate: (p: Player, w: World) => {},
  OnExit: (p: Player, w: World) => {
    p.Flags.ChangeDirections();
  },
};

export const Dash: FSMState = {
  StateName: 'DASH',
  StateId: STATE_IDS.DASH_S,
  OnEnter: (p: Player, w: World) => {
    const flags = p.Flags;
    const MaxDashSpeed = p.Speeds.MaxDashSpeed;
    const impulse = flags.IsFacingRight
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
  OnExit: (p: Player, w: World) => {},
};

export const DashTurn: FSMState = {
  StateName: 'DASH_TURN',
  StateId: STATE_IDS.DASH_TURN_S,
  OnEnter: (p: Player, w: World) => {
    p.Velocity.X = 0;
    p.Flags.ChangeDirections();
  },
  OnUpdate: (p: Player, w: World) => {},
  OnExit: (p: Player, w: World) => {},
};

export const Run: FSMState = {
  StateName: 'RUN',
  StateId: STATE_IDS.RUN_S,
  OnEnter: (p: Player, w: World) => {},
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID);
    if (ia !== undefined) {
      const speeds = p.Speeds;
      p.Velocity.AddClampedXImpulse(
        speeds.MaxRunSpeed,
        ia.LXAxsis * speeds.RunSpeedMultiplier
      );
    }
  },
  OnExit: (p: Player, w: World) => {},
};

export const RunTurn: FSMState = {
  StateName: 'RUN_TURN',
  StateId: STATE_IDS.RUN_TURN_S,
  OnEnter: (p: Player, w: World) => {
    p.Flags.SetCanWalkOffFalse();
  },
  OnUpdate: (p: Player, w: World) => {},
  OnExit: (p: Player, w: World) => {
    p.Flags.ChangeDirections();
    p.Flags.SetCanWalkOffTrue();
  },
};

export const RunStop: FSMState = {
  StateName: 'RUN_STOP',
  StateId: STATE_IDS.STOP_RUN_S,
  OnEnter: (p: Player, w: World) => {
    p.Flags.SetCanWalkOffFalse();
  },
  OnUpdate: (p: Player, w: World) => {},
  OnExit: (p: Player, w: World) => {
    p.Flags.SetCanWalkOffTrue();
  },
};

export const JumpSquat: FSMState = {
  StateName: 'JUMPSQUAT',
  StateId: STATE_IDS.JUMP_SQUAT_S,
  OnEnter: (p: Player, w: World) => {},
  OnUpdate: (p: Player, w: World) => {},
  OnExit: (p: Player, w: World) => {},
};

export const Jump: FSMState = {
  StateName: 'JUMP',
  StateId: STATE_IDS.JUMP_S,
  OnEnter: (p: Player, w: World) => {
    const jumpComp = p.Jump;
    if (jumpComp.HasJumps()) {
      p.Flags.FastFallOff();
      p.AddToPlayerYPosition(-0.5);
      jumpComp.IncrementJumps();
    }
    p.ECB.SetECBShape(-25, 60, 70);
  },
  OnUpdate: (p: Player, w: World) => {
    if (p.FSMInfo.CurrentStateFrame === 0 && p.Jump.OnFirstJump()) {
      p.AddToPlayerYPosition(-p.ECB.YOffset);
      return;
    }

    if (p.FSMInfo.CurrentStateFrame === 1) {
      p.Velocity.Y = -p.Jump.JumpVelocity;
    }

    const inputAction = w.GetPlayerCurrentInput(p.ID);
    const speedsComp = p.Speeds;
    p.Velocity.AddClampedXImpulse(
      speedsComp.AerialSpeedInpulseLimit,
      (inputAction?.LXAxsis ?? 0) * speedsComp.ArielVelocityMultiplier
    );
  },
  OnExit: (p: Player, w: World) => {
    p.ECB.ResetECBShape();
  },
};

export const NeutralFall: FSMState = {
  StateName: 'NFALL',
  StateId: STATE_IDS.N_FALL_S,
  OnEnter: (p: Player, w: World) => {
    p.ECB.SetECBShape(-25, 60, 70);
    if (p.Jump.JumpCountIsZero()) {
      p.Jump.IncrementJumps();
    }
  },
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID)!;
    const speedsComp = p.Speeds;
    const prevIa = w.GetPlayerPreviousInput(p.ID)!;

    if (p.Velocity.Y > 0 && ia.LYAxsis < -0.8 && prevIa.LYAxsis > -0.8) {
      p.Flags.FastFallOn();
    }

    p.Velocity.AddClampedXImpulse(
      speedsComp.AerialSpeedInpulseLimit,
      ia.LXAxsis * speedsComp.ArielVelocityMultiplier
    );
  },
  OnExit: (p: Player, w: World) => {
    p.ECB.ResetECBShape();
  },
};

export const Land: FSMState = {
  StateName: 'Land',
  StateId: STATE_IDS.LAND_S,
  OnEnter: (p: Player, w: World) => {
    p.Flags.FastFallOff();
    p.Jump.ResetJumps();
    p.Velocity.Y = 0;
  },
  OnUpdate: (p: Player, w: World) => {},
  OnExit: (p: Player, w: World) => {},
};

export const SoftLand: FSMState = {
  StateName: 'SoftLand',
  StateId: STATE_IDS.SOFT_LAND_S,
  OnEnter: (p: Player, w: World) => {
    p.Flags.FastFallOff();
    p.Jump.ResetJumps();
    p.Velocity.Y = 0;
  },
  OnUpdate: (p: Player, w: World) => {},
  OnExit: (p: Player, w: World) => {},
};

export const LedgeGrab: FSMState = {
  StateName: 'LedgeGrab',
  StateId: STATE_IDS.LEDGE_GRAB_S,
  OnEnter: (p: Player, w: World) => {
    p.Flags.FastFallOff();
    p.Flags.GravityOff();
    p.Velocity.X = 0;
    p.Velocity.Y = 0;
    const jumpComp = p.Jump;
    jumpComp.ResetJumps();
    jumpComp.IncrementJumps();
  },
  OnUpdate: (p: Player, w: World) => {},
  OnExit: (p: Player, w: World) => {
    p.Flags.GravityOn();
  },
};

export const AirDodge: FSMState = {
  StateName: 'AirDodge',
  StateId: STATE_IDS.AIR_DODGE_S,
  OnEnter: (p: Player, w: World) => {
    p.Flags.FastFallOff();
    p.Flags.GravityOff();
    const pVel = p.Velocity;
    const ia = w.GetPlayerCurrentInput(p.ID)!;
    const angle = Math.atan2(ia?.LYAxsis, ia?.LXAxsis);
    const speed = p.Speeds.AirDogeSpeed;
    pVel.X = Math.cos(angle) * speed;
    pVel.Y = -Math.sin(angle) * speed;
  },
  OnUpdate: (p: Player, w: World) => {
    const frameLength = p.FSMInfo.GetFrameLengthForState(
      STATE_IDS.AIR_DODGE_S
    )!;
    const currentFrameForState = p.FSMInfo.CurrentStateFrame;
    const normalizedTime = Math.min(currentFrameForState / frameLength, 1);
    const ease = EaseIn(normalizedTime);
    const pVel = p.Velocity;
    pVel.X *= 1 - ease;
    pVel.Y *= 1 - ease;
  },
  OnExit: (p: Player, w: World) => {
    p.Flags.GravityOn();
  },
};

export const Helpess: FSMState = {
  StateName: 'Helpess',
  StateId: STATE_IDS.HELPESS_S,
  OnEnter: (p: Player, w: World) => {
    if (p.Jump.OnFirstJump()) {
      p.Jump.IncrementJumps();
    }
  },
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID);
    const speeds = p.Speeds;
    const airSpeed = speeds.AerialSpeedInpulseLimit;
    const airMult = speeds.AirDogeSpeed;
    p.Velocity.AddClampedXImpulse(airSpeed, (ia!.LXAxsis * airMult) / 2);
  },
  OnExit: (p: Player, w: World) => {},
};

export const Attack: FSMState = {
  StateName: 'Attack',
  StateId: STATE_IDS.ATTACK_S,
  OnEnter: (p: Player, w: World) => {
    p.Attacks.SetCurrentAttack(GAME_EVENT_IDS.ATTACK_GE);
  },
  OnUpdate: (p: Player, w: World) => {
    const attackComp = p.Attacks;
    const attack = attackComp.GetAttack();
    const impulse = attack?.GetActiveImpulseForFrame(
      p.FSMInfo.CurrentStateFrame
    );

    if (impulse === undefined) {
      return;
    }

    const x = p.Flags.IsFacingRight ? impulse.X : -impulse.X;
    const y = impulse.Y;
    const clamp = attack?.ImpulseClamp;
    const pVel = p.Velocity;
    if (clamp !== undefined) {
      pVel.AddClampedXImpulse(clamp, x);
      pVel.AddClampedYImpulse(clamp, y);
    }
  },
  OnExit: (p: Player, w: World) => {
    const attackComp = p.Attacks;
    attackComp.ZeroCurrentAttack();
  },
};

export const AerialAttack: FSMState = {
  StateName: 'AerialAttack',
  StateId: STATE_IDS.N_AIR_S,
  OnEnter: (p: Player, w: World) => {
    p.Attacks.SetCurrentAttack(GAME_EVENT_IDS.N_AIR_GE);
    p.ECB.SetECBShape(-25, 60, 70);
  },
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID)!;
    const prevIa = w.GetPlayerPreviousInput(p.ID);
    const speeds = p.Speeds;
    const airSpeed = speeds.AerialSpeedInpulseLimit;
    const airMult = speeds.AirDogeSpeed;
    p.Velocity.AddClampedXImpulse(airSpeed, (ia!.LXAxsis * airMult) / 2);
    if (prevIa !== undefined && ShouldFastFall(ia.LYAxsis, prevIa.LYAxsis)) {
      p.Flags.FastFallOn();
    }
  },
  OnExit(p: Player, w: World) {
    const attackComp = p.Attacks;
    attackComp.ZeroCurrentAttack();
    p.ECB.ResetECBShape();
  },
};

export const FAerialAttack: FSMState = {
  StateName: 'FAir',
  StateId: STATE_IDS.F_AIR_S,
  OnEnter: (p: Player, w: World) => {
    p.Attacks.SetCurrentAttack(GAME_EVENT_IDS.F_AIR_GE);
    p.ECB.SetECBShape(-25, 60, 70);
  },
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID)!;
    const prevIa = w.GetPlayerPreviousInput(p.ID);
    const speedsComp = p.Speeds;
    p.Velocity.AddClampedXImpulse(
      speedsComp.AerialSpeedInpulseLimit,
      ia.LXAxsis * speedsComp.ArielVelocityMultiplier
    );
    if (prevIa !== undefined && ShouldFastFall(ia.LYAxsis, prevIa.LYAxsis)) {
      p.Flags.FastFallOn();
    }
  },
  OnExit: (p: Player, w: World) => {
    const attackComp = p.Attacks;
    attackComp.ZeroCurrentAttack();
    p.ECB.ResetECBShape();
  },
};

export const UAirAttack: FSMState = {
  StateName: 'UAir',
  StateId: STATE_IDS.U_AIR_S,
  OnEnter: (p: Player, w: World) => {
    p.Attacks.SetCurrentAttack(GAME_EVENT_IDS.U_AIR_GE);
    p.ECB.SetECBShape(-25, 60, 60);
  },
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID)!;
    const prevIa = w.GetPlayerPreviousInput(p.ID);
    const speedsComp = p.Speeds;
    p.Velocity.AddClampedXImpulse(
      speedsComp.AerialSpeedInpulseLimit,
      ia.LXAxsis * speedsComp.ArielVelocityMultiplier
    );
    if (prevIa !== undefined && ShouldFastFall(ia.LYAxsis, prevIa.LYAxsis)) {
      p.Flags.FastFallOn();
    }
  },
  OnExit: (p: Player, w: World) => {
    const attackComp = p.Attacks;
    attackComp.ZeroCurrentAttack();
    p.ECB.ResetECBShape();
  },
};

export const BAirAttack: FSMState = {
  StateName: 'BAir',
  StateId: STATE_IDS.B_AIR_S,
  OnEnter: (p: Player, w: World) => {
    p.Attacks.SetCurrentAttack(GAME_EVENT_IDS.B_AIR_GE);
    p.ECB.SetECBShape(-25, 60, 60);
  },
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID)!;
    const prevIa = w.GetPlayerPreviousInput(p.ID);
    const speedsComp = p.Speeds;
    p.Velocity.AddClampedXImpulse(
      speedsComp.AerialSpeedInpulseLimit,
      ia.LXAxsis * speedsComp.ArielVelocityMultiplier
    );
    if (prevIa !== undefined && ShouldFastFall(ia.LYAxsis, prevIa.LYAxsis)) {
      p.Flags.FastFallOn();
    }
  },
  OnExit: (p: Player, w: World) => {
    const attackComp = p.Attacks;
    attackComp.ZeroCurrentAttack();
    p.ECB.ResetECBShape();
  },
};

export const DAirAttack: FSMState = {
  StateName: 'DAir',
  StateId: STATE_IDS.D_AIR_S,
  OnEnter: (p: Player, w: World) => {
    p.Attacks.SetCurrentAttack(GAME_EVENT_IDS.D_AIR_GE);
    p.ECB.SetECBShape(-10, 90, 60);
  },
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID)!;
    const prevIa = w.GetPlayerPreviousInput(p.ID);
    const speedsComp = p.Speeds;
    p.Velocity.AddClampedXImpulse(
      speedsComp.AerialSpeedInpulseLimit,
      ia.LXAxsis * speedsComp.ArielVelocityMultiplier
    );
    if (prevIa !== undefined && ShouldFastFall(ia.LYAxsis, prevIa.LYAxsis)) {
      p.Flags.FastFallOn();
    }
  },
  OnExit: (p: Player, w: World) => {
    p.Attacks.ZeroCurrentAttack();
    p.ECB.ResetECBShape();
  },
};

export const DownSpecial: FSMState = {
  StateName: 'DownSpecial',
  StateId: STATE_IDS.DOWN_SPECIAL_S,
  OnEnter: (p: Player, w: World) => {
    const attackComp = p.Attacks;
    attackComp.SetCurrentAttack(GAME_EVENT_IDS.DOWN_SPECIAL_GE);
    const gravity = attackComp.GetAttack()!.GravityActive;
    if (gravity === false) {
      p.Flags.GravityOff();
    }
  },
  OnUpdate: (p: Player, w: World) => {
    const attackComp = p.Attacks;
    const attack = attackComp.GetAttack();
    const impulse = attack?.GetActiveImpulseForFrame(
      p.FSMInfo.CurrentStateFrame
    );

    if (impulse === undefined) {
      return;
    }

    const x = p.Flags.IsFacingRight ? impulse.X : -impulse.X;
    const y = impulse.Y;
    const clamp = attack?.ImpulseClamp;
    const pVel = p.Velocity;
    if (clamp !== undefined) {
      pVel.AddClampedXImpulse(clamp, x);
      pVel.AddClampedYImpulse(clamp, y);
    }
  },
  OnExit: (p: Player, w: World) => {
    const attackComp = p.Attacks;
    p.Flags.GravityOn();
    p.Attacks.GetAttack()!.ResetPlayeIdHitArray();
    attackComp.ZeroCurrentAttack();
  },
};

export const hitStop: FSMState = {
  StateName: 'HitStop',
  StateId: STATE_IDS.HIT_STOP_S,
  OnEnter: (p: Player, world: World) => {
    p.Flags.FastFallOff();
    p.Flags.GravityOff();
    p.Velocity.X = 0;
    p.Velocity.Y = 0;
  },
  OnUpdate: (p: Player, world: World) => {
    p.HitStop.Decrement();
  },
  OnExit: (p: Player, world: World) => {
    p.Flags.GravityOn();
    p.HitStop.SetZero();
  },
};

export const Launch: FSMState = {
  StateName: 'Launch',
  StateId: STATE_IDS.LAUNCH_S,
  OnEnter: (p: Player, w: World) => {
    const pVel = p.Velocity;
    const hitStun = p.HitStun;
    pVel.X = hitStun.VX;
    pVel.Y = hitStun.VY;
    if (p.Jump.OnFirstJump()) {
      p.Jump.IncrementJumps();
    }
  },
  OnUpdate: (p: Player, w: World) => {
    p.HitStun.DecrementHitStun();
  },
  OnExit: (p, w) => {
    p.HitStun.Zero();
  },
};

export const Tumble: FSMState = {
  StateName: 'Tumble',
  StateId: STATE_IDS.TUMBLE_S,
  OnEnter: (p: Player, w: World) => {
    p.Jump.ResetJumps();
    p.Jump.IncrementJumps();
  },
  OnUpdate: (p: Player, w: World) => {
    const ia = w.GetPlayerCurrentInput(p.ID);
    const speeds = p.Speeds;
    const airSpeed = speeds.AerialSpeedInpulseLimit;
    const airMult = speeds.AirDogeSpeed;
    p.Velocity.AddClampedXImpulse(airSpeed, (ia!.LXAxsis * airMult) / 2);
  },
  OnExit: (p: Player, w: World) => {},
};

export const Crouch: FSMState = {
  StateName: 'Crouch',
  StateId: STATE_IDS.CROUCH_S,
  OnEnter: (p: Player, w: World) => {
    p.ECB.SetECBShape(0, 50, 100);
    p.Flags.SetCanWalkOffFalse();
  },
  OnUpdate: (p: Player, w: World) => {},
  OnExit: (p: Player, w: World) => {
    p.ECB.ResetECBShape();
    p.Flags.SetCanWalkOffTrue();
  },
};

function ShouldFastFall(curLYAxsis: number, prevLYAxsis: number): boolean {
  if (curLYAxsis < -0.8 && prevLYAxsis > -0.8) {
    return true;
  }
  return false;
}

//================================================
const IDLE_STATE_RELATIONS = InitIdleRelations();
const START_WALK_RELATIONS = InitStartWalkRelations();
const TURN_RELATIONS = InitTurnRelations();
const WALK_RELATIONS = InitWalkRelations();
const DASH_RELATIONS = InitDashRelations();
const DASH_TURN_RELATIONS = InitDashTurnRelations();
const RUN_RELATIONS = InitRunRelations();
const RUN_TURN_RELATIONS = InitRunTurnRelations();
const STOP_RUN_RELATIONS = InitStopRunRelations();
const JUMP_SQUAT_RELATIONS = InitJumpSquatRelations();
const JUMP_RELATIONS = InitJumpRelations();
const NFALL_RELATIONS = InitNeutralFallRelations();
const LAND_RELATIONS = InitLandRelations();
const SOFT_LAND_RELATIONS = InitSoftLandRelations();
const LEDGE_GRAB_RELATIONS = InitLedgeGrabRelations();
const AIR_DODGE_RELATIONS = InitAirDodgeRelations();
const HELPESS_RELATIONS = InitHelpessRelations();
const ATTACK_RELATIONS = InitAttackRelations();
const AIR_ATK_RELATIONS = InitAirAttackRelations();
const F_AIR_ATK_RELATIONS = InitFAirAttackRelations();
const U_AIR_ATK_RELATIONS = InitUAirRelations();
const B_AIR_ATK_RELATIONS = InitBAirRelations();
const D_AIR_ATK_RELATIONS = InitDAirRelations();
const DOWN_SPECIAL_RELATIONS = InitDownSpecialRelations();
const HIT_STOP_RELATIONS = InitHitStopRelations();
const TUMBLE_RELATIONS = InitTumbleRelations();
const LAUNCH_RELATIONS = InitLaunchRelations();
const CROUCH_RELATIONS = InitCrouchRelations();

export const ActionMappings = new Map<StateId, ActionStateMappings>()
  .set(IDLE_STATE_RELATIONS.stateId, IDLE_STATE_RELATIONS.mappings)
  .set(START_WALK_RELATIONS.stateId, START_WALK_RELATIONS.mappings)
  .set(TURN_RELATIONS.stateId, TURN_RELATIONS.mappings)
  .set(WALK_RELATIONS.stateId, WALK_RELATIONS.mappings)
  .set(DASH_RELATIONS.stateId, DASH_RELATIONS.mappings)
  .set(DASH_TURN_RELATIONS.stateId, DASH_TURN_RELATIONS.mappings)
  .set(RUN_RELATIONS.stateId, RUN_RELATIONS.mappings)
  .set(RUN_TURN_RELATIONS.stateId, RUN_TURN_RELATIONS.mappings)
  .set(STOP_RUN_RELATIONS.stateId, STOP_RUN_RELATIONS.mappings)
  .set(JUMP_SQUAT_RELATIONS.stateId, JUMP_SQUAT_RELATIONS.mappings)
  .set(JUMP_RELATIONS.stateId, JUMP_RELATIONS.mappings)
  .set(NFALL_RELATIONS.stateId, NFALL_RELATIONS.mappings)
  .set(LAND_RELATIONS.stateId, LAND_RELATIONS.mappings)
  .set(SOFT_LAND_RELATIONS.stateId, SOFT_LAND_RELATIONS.mappings)
  .set(LEDGE_GRAB_RELATIONS.stateId, LEDGE_GRAB_RELATIONS.mappings)
  .set(AIR_DODGE_RELATIONS.stateId, AIR_DODGE_RELATIONS.mappings)
  .set(HELPESS_RELATIONS.stateId, HELPESS_RELATIONS.mappings)
  .set(ATTACK_RELATIONS.stateId, ATTACK_RELATIONS.mappings)
  .set(AIR_ATK_RELATIONS.stateId, AIR_ATK_RELATIONS.mappings)
  .set(F_AIR_ATK_RELATIONS.stateId, F_AIR_ATK_RELATIONS.mappings)
  .set(U_AIR_ATK_RELATIONS.stateId, U_AIR_ATK_RELATIONS.mappings)
  .set(B_AIR_ATK_RELATIONS.stateId, B_AIR_ATK_RELATIONS.mappings)
  .set(D_AIR_ATK_RELATIONS.stateId, D_AIR_ATK_RELATIONS.mappings)
  .set(DOWN_SPECIAL_RELATIONS.stateId, DOWN_SPECIAL_RELATIONS.mappings)
  .set(HIT_STOP_RELATIONS.stateId, HIT_STOP_RELATIONS.mappings)
  .set(TUMBLE_RELATIONS.stateId, TUMBLE_RELATIONS.mappings)
  .set(LAUNCH_RELATIONS.stateId, LAUNCH_RELATIONS.mappings)
  .set(CROUCH_RELATIONS.stateId, CROUCH_RELATIONS.mappings);

export const FSMStates = new Map<StateId, FSMState>()
  .set(Idle.StateId, Idle)
  .set(StartWalk.StateId, StartWalk)
  .set(Turn.StateId, Turn)
  .set(Walk.StateId, Walk)
  .set(Run.StateId, Run)
  .set(RunTurn.StateId, RunTurn)
  .set(RunStop.StateId, RunStop)
  .set(Dash.StateId, Dash)
  .set(DashTurn.StateId, DashTurn)
  .set(JumpSquat.StateId, JumpSquat)
  .set(Jump.StateId, Jump)
  .set(NeutralFall.StateId, NeutralFall)
  .set(Land.StateId, Land)
  .set(SoftLand.StateId, SoftLand)
  .set(LedgeGrab.StateId, LedgeGrab)
  .set(AirDodge.StateId, AirDodge)
  .set(Helpess.StateId, Helpess)
  .set(Attack.StateId, Attack)
  .set(AerialAttack.StateId, AerialAttack)
  .set(FAerialAttack.StateId, FAerialAttack)
  .set(UAirAttack.StateId, UAirAttack)
  .set(BAirAttack.StateId, BAirAttack)
  .set(DAirAttack.StateId, DAirAttack)
  .set(DownSpecial.StateId, DownSpecial)
  .set(hitStop.StateId, hitStop)
  .set(Tumble.StateId, Tumble)
  .set(Launch.StateId, Launch)
  .set(Crouch.StateId, Crouch);

export const AttackGameEventMappings = new Map<GameEventId, AttackId>()
  .set(GAME_EVENT_IDS.ATTACK_GE, ATTACK_IDS.NUETRAL_ATTACK)
  .set(GAME_EVENT_IDS.N_AIR_GE, ATTACK_IDS.N_AIR_ATTACK)
  .set(GAME_EVENT_IDS.F_AIR_GE, ATTACK_IDS.F_AIR_ATTACK)
  .set(GAME_EVENT_IDS.U_AIR_GE, ATTACK_IDS.U_AIR_ATTACK)
  .set(GAME_EVENT_IDS.B_AIR_GE, ATTACK_IDS.B_AIR_ATTACK)
  .set(GAME_EVENT_IDS.D_AIR_GE, ATTACK_IDS.D_AIR_ATTACK)
  .set(GAME_EVENT_IDS.DOWN_SPECIAL_GE, ATTACK_IDS.DOWN_SPECIAL);
