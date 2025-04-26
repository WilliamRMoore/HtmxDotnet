import { Player } from '../player/playerOrchestrator';
import { World } from '../world/world';
import { InputAction } from '../../loops/Input';
import {
  ActionStateMappings,
  AIR_DODGE_RELATIONS,
  AirDodge,
  Dash,
  DASH_RELATIONS,
  DASH_TURN_RELATIONS,
  DashTurn,
  FastFall,
  FFALL_RELATIONS,
  gameEventId,
  Helpess,
  HELPESS_RELATIONS,
  Idle,
  IDLE_STATE_RELATIONS,
  Jump,
  JUMP_RELATIONS,
  JUMP_SQUAT_RELATIONS,
  JumpSquat,
  Land,
  LAND_RELATIONS,
  LEDGE_GRAB_RELATIONS,
  LedgeGrab,
  NeutralFall,
  NFALL_RELATIONS,
  Run,
  RUN_RELATIONS,
  RUN_TURN_RELATIONS,
  RunCondition,
  RunStop,
  RunTurn,
  SOFT_LAND_RELATIONS,
  SoftLand,
  START_WALK_RELATIONS,
  StartWalk,
  stateId,
  STOP_RUN_RELATIONS,
  Turn,
  TURN_RELATIONS,
  Walk,
  WALK_RELATIONS,
} from './PlayerStates';

export type FSMState = {
  StateName: string;
  StateId: number;
  InteruptFrame?: number;
  OnEnter?: (p: Player, world: World) => void;
  OnUpdate?: (p: Player, world: World) => void;
  OnExit?: (p: Player, world: World) => void;
};

export class StateMachine {
  private player: Player;
  private world: World;
  private stateMappings: Map<stateId, ActionStateMappings> = new Map();
  private states: Map<stateId, FSMState> = new Map();

  constructor(p: Player, world: World) {
    this.player = p;
    this.world = world;
    this.player.FSMInfo.SetCurrentState(Idle);
    this.stateMappings
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
      .set(FFALL_RELATIONS.stateId, FFALL_RELATIONS.mappings)
      .set(LAND_RELATIONS.stateId, LAND_RELATIONS.mappings)
      .set(SOFT_LAND_RELATIONS.stateId, SOFT_LAND_RELATIONS.mappings)
      .set(LEDGE_GRAB_RELATIONS.stateId, LEDGE_GRAB_RELATIONS.mappings)
      .set(AIR_DODGE_RELATIONS.stateId, AIR_DODGE_RELATIONS.mappings)
      .set(HELPESS_RELATIONS.stateId, HELPESS_RELATIONS.mappings);

    this.states
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
      .set(FastFall.StateId, FastFall)
      .set(Land.StateId, Land)
      .set(SoftLand.StateId, SoftLand)
      .set(LedgeGrab.StateId, LedgeGrab)
      .set(AirDodge.StateId, AirDodge)
      .set(Helpess.StateId, Helpess);
  }

  public SetInitialState(stateId: stateId) {
    this.changeState(this.states.get(stateId)!);
  }

  public UpdateFromWorld(gameEventId: gameEventId) {
    // world events should still have to follow mapping rules
    const state = this.GetTranslation(gameEventId);
    if (state != undefined) {
      const fsmInfo = this.player.FSMInfo;

      this.changeState(state);
      fsmInfo.CurrentState.OnUpdate?.(this.player, this.world);
      fsmInfo.IncrementStateFrame();
    }
  }

  public ForceState(sateId: stateId) {
    //ignore mapping rules and force a state change
    const state = this.states.get(sateId);

    if (state == undefined) {
      return;
    }

    const fsmInfo = this.player.FSMInfo;

    this.changeState(state);
    fsmInfo.CurrentState.OnUpdate?.(this.player, this.world);
    fsmInfo.IncrementStateFrame();
  }

  public UpdateFromInput(inputAction: InputAction, world: World): void {
    // if we have a conditional on the state, check it
    if (this.RunConditional(world)) {
      return;
    }

    // if our input is a valid transition, run it
    if (this.RunNext(inputAction)) {
      return;
    }

    // if we have a default state, run it
    if (this.RunDefault(world)) {
      return;
    }

    // None of the above? Update current state
    this.updateState();
  }

  private RunNext(inputAction: InputAction): boolean {
    const state = this.GetTranslation(inputAction.Action);

    if (state != undefined) {
      this.changeState(state);
      this.updateState();
      return true;
    }

    return false;
  }

  private RunDefault(w: World): boolean {
    // Check to see if we are on a default frame
    // If not, return false
    if (!this.IsDefaultFrame()) {
      return false;
    }

    const defaultTransition = this.GetDefaultState(
      this.player.FSMInfo.CurrentState.StateId,
      w
    );

    // No default transition resolved, return false
    if (defaultTransition == undefined) {
      return false;
    }

    // Default transition resolved, change/update state, return true
    this.changeState(defaultTransition);
    this.updateState();

    return true;
  }

  private RunConditional(world: World): boolean {
    const conditions = this.stateMappings
      .get(this.player.FSMInfo.CurrentState.StateId)!
      .GetConditions();

    // We have no conditionals, return
    if (conditions === undefined) {
      return false;
    }

    const conditionalsLength = conditions.length;

    // Loop through all conditionals, if one returns a stateId, run it and return true, otherwise return false
    for (let i = 0; i < conditionalsLength; i++) {
      const res = RunCondition(conditions[i], world, this.player.ID);

      // Condition returned a stateId, check it
      if (res !== undefined) {
        const state = this.states.get(res);

        // stateId did not resolve, return false
        if (state == undefined) {
          return false;
        }

        // stateId resolved, change state and return true
        this.changeState(state);
        this.updateState();

        return true;
      }
    }

    // None of the conditions returned a stateId, return false
    return false;
  }

  private GetTranslation(gameEventId: gameEventId): FSMState | undefined {
    const stateMappings = this.stateMappings.get(
      this.player.FSMInfo.CurrentState.StateId
    );
    const nextStateId = stateMappings?.getMapping(gameEventId);

    if (nextStateId !== undefined) {
      const state = this.states.get(nextStateId);
      return state;
    }

    return undefined;
  }

  private GetDefaultState(stateId: stateId, w: World): FSMState | undefined {
    const stateMapping = this.stateMappings.get(stateId);

    if (stateMapping == undefined) {
      return undefined;
    }

    const defaultStateConditions = stateMapping.getDefaults();

    if (defaultStateConditions === undefined) {
      return undefined;
    }

    for (let i = 0; i < defaultStateConditions.length; i++) {
      const condition = defaultStateConditions[i];

      const stateId = RunCondition(condition, w, this.player.ID);

      if (stateId != undefined) {
        return this.states.get(stateId);
      }
    }

    return undefined;
  }

  private changeState(state: FSMState) {
    const p = this.player;
    const fsmInfo = p.FSMInfo;
    fsmInfo.SetStateFrameToZero();
    fsmInfo.CurrentState.OnExit?.(this.player, this.world);
    fsmInfo.SetCurrentState(state);
    fsmInfo.CurrentState.OnEnter?.(this.player, this.world);
  }

  private updateState() {
    const fsmInfo = this.player.FSMInfo;
    fsmInfo.CurrentState.OnUpdate?.(this.player, this.world);
    fsmInfo.IncrementStateFrame();
  }

  private IsDefaultFrame(): boolean {
    const fsmInfo = this.player.FSMInfo;
    const fl = this.player.StateFrameLengths.GetFrameLengthOrUndefined(
      fsmInfo.CurrentState.StateId
    );

    if (fl === undefined) {
      return false;
    }

    if (fl == fsmInfo.CurrentStateFrame) {
      return true;
    }

    return false;
  }

  public get CurrentStateName(): string {
    return this.player.FSMInfo.CurrentState.StateName ?? 'N/A';
  }
}
