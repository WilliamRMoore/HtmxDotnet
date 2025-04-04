import {
  Dash,
  DashTurn,
  FastFall,
  Idle,
  Jump,
  JumpSquat,
  Land,
  NeutralFall,
  Run,
  RunStop,
  RunTurn,
  SoftLand,
  StartWalk,
  StopDash,
  Turn,
  Walk,
} from '../CharacterStates/TestCharacterStates';
import { Player } from '../engine/player/playerOrchestrator';
import { World } from '../engine/world/world';
import { InputAction } from '../loops/Input';
import {
  ActionStateMappings,
  DASH_RELATIONS,
  DASH_TURN_RELATIONS,
  FFALL_RELATIONS,
  gameEventId,
  IDLE_STATE_RELATIONS,
  JUMP_RELATIONS,
  JUMP_SQUAT_RELATIONS,
  LAND_RELATIONS,
  NFALL_RELATIONS,
  RUN_RELATIONS,
  RUN_TURN_RELATIONS,
  SOFT_LAND_RELATIONS,
  START_WALK_RELATIONS,
  stateId,
  STOP_DASH_RELATIONS,
  STOP_RUN_RELATIONS,
  TURN_RELATIONS,
  WALK_RELATIONS,
} from './FiniteState';

export type FSMState = {
  StateName: string;
  StateId: number;
  FrameLength?: number;
  InteruptFrame?: number;
  OnEnter?: (p: Player, ia?: InputAction) => void;
  OnUpdate?: (p: Player, inputAction?: InputAction) => void;
  OnExit?: (p: Player) => void;
};

export class StateMachine {
  private _stateFrameCount: number = 0;
  private _player: Player;
  private _currentState: FSMState;
  private _stateMappings: Map<stateId, ActionStateMappings> = new Map<
    stateId,
    ActionStateMappings
  >();
  private _states: Map<stateId, FSMState> = new Map<stateId, FSMState>();

  constructor(p: Player) {
    this._player = p;
    this._currentState = Idle;

    this._stateMappings.set(
      IDLE_STATE_RELATIONS.stateId,
      IDLE_STATE_RELATIONS.mappings
    );
    this._stateMappings.set(
      START_WALK_RELATIONS.stateId,
      START_WALK_RELATIONS.mappings
    );
    this._stateMappings.set(TURN_RELATIONS.stateId, TURN_RELATIONS.mappings);
    this._stateMappings.set(WALK_RELATIONS.stateId, WALK_RELATIONS.mappings);
    this._stateMappings.set(DASH_RELATIONS.stateId, DASH_RELATIONS.mappings);
    this._stateMappings.set(
      DASH_TURN_RELATIONS.stateId,
      DASH_TURN_RELATIONS.mappings
    );
    this._stateMappings.set(
      STOP_DASH_RELATIONS.stateId,
      STOP_DASH_RELATIONS.mappings
    );
    this._stateMappings.set(RUN_RELATIONS.stateId, RUN_RELATIONS.mappings);
    this._stateMappings.set(
      RUN_TURN_RELATIONS.stateId,
      RUN_TURN_RELATIONS.mappings
    );
    this._stateMappings.set(
      STOP_RUN_RELATIONS.stateId,
      STOP_RUN_RELATIONS.mappings
    );
    this._stateMappings.set(
      JUMP_SQUAT_RELATIONS.stateId,
      JUMP_SQUAT_RELATIONS.mappings
    );
    this._stateMappings.set(JUMP_RELATIONS.stateId, JUMP_RELATIONS.mappings);
    this._stateMappings.set(NFALL_RELATIONS.stateId, NFALL_RELATIONS.mappings);
    this._stateMappings.set(FFALL_RELATIONS.stateId, FFALL_RELATIONS.mappings);
    this._stateMappings.set(LAND_RELATIONS.stateId, LAND_RELATIONS.mappings);
    this._stateMappings.set(
      SOFT_LAND_RELATIONS.stateId,
      SOFT_LAND_RELATIONS.mappings
    );

    this._states.set(Idle.StateId, Idle);
    this._states.set(StartWalk.StateId, StartWalk);
    this._states.set(Turn.StateId, Turn);
    this._states.set(Walk.StateId, Walk);
    this._states.set(Run.StateId, Run);
    this._states.set(RunTurn.StateId, RunTurn);
    this._states.set(RunStop.StateId, RunStop);
    this._states.set(Dash.StateId, Dash);
    this._states.set(DashTurn.StateId, DashTurn);
    this._states.set(StopDash.StateId, StopDash);
    this._states.set(JumpSquat.StateId, JumpSquat);
    this._states.set(Jump.StateId, Jump);
    this._states.set(NeutralFall.StateId, NeutralFall);
    this._states.set(FastFall.StateId, FastFall);
    this._states.set(Land.StateId, Land);
    this._states.set(SoftLand.StateId, SoftLand);
  }

  public SetInitialState(stateId: stateId) {
    this.changeState(this._states.get(stateId)!);
  }

  public UpdateFromWorld(gameEventId: gameEventId) {
    const state = this.GetTranslation(gameEventId);
    if (state != undefined) {
      this.changeState(state);
      this._currentState.OnUpdate?.(this._player);
      this._stateFrameCount++;
    }
  }

  public UpdateFromInput(inputAction: InputAction, world: World): void {
    // if we have a conditional on the state, check it
    if (this.RunConditional(inputAction, world)) {
      return;
    }

    // if our input is a valid transition, run it
    if (this.RunNext(inputAction)) {
      return;
    }

    // if we have a default state, run it
    if (this.RunDefault(inputAction)) {
      return;
    }

    // None of the above? Update current state
    this.updateState(inputAction);
  }

  private RunNext(inputAction: InputAction): boolean {
    const state = this.GetTranslation(inputAction.Action);

    if (state != undefined) {
      this.changeState(state, inputAction);
      this.updateState(inputAction);
      return true;
    }

    return false;
  }

  private RunDefault(inputAction: InputAction): boolean {
    // Check to see if we are on a default frame
    // If not, return false
    if (!this.IsDefaultFrame()) {
      return false;
    }

    const defaultTransition = this.GetDefaultState(this._currentState.StateId);

    // No default transition resolved, return false
    if (defaultTransition == undefined) {
      return false;
    }

    // Default transition resolved, change/update state, return true
    this.changeState(defaultTransition, inputAction);
    this.updateState(inputAction);

    return true;
  }

  private RunConditional(inputAction: InputAction, world: World): boolean {
    const mappings = this._stateMappings.get(this._currentState.StateId);
    const conditions = mappings?.GetConditions();

    // We have no conditionals, return
    if (conditions === undefined) {
      return false;
    }

    const conditionalsLength = conditions.length;

    // Loop through all conditionals, if one returns a stateId, run it and return true, otherwise return false
    for (let i = 0; i < conditionalsLength; i++) {
      const res = conditions[i].ConditionFunc(world);

      // Condition returned a stateId, check it
      if (res !== undefined) {
        const state = this._states.get(res);

        // stateId did not resolve, return false
        if (state == undefined) {
          return false;
        }

        // stateId resolved, change state and return true
        this.changeState(state, inputAction);
        this.updateState(inputAction);

        return true;
      }
    }

    // None of the conditions returned a stateId, return false
    return false;
  }

  private GetTranslation(gameEventId: gameEventId): FSMState | undefined {
    const stateMappings = this._stateMappings.get(this._currentState.StateId);
    const nextStateId = stateMappings?.getMapping(gameEventId);

    if (nextStateId !== undefined) {
      const state = this._states.get(nextStateId);
      return state;
    }

    return undefined;
  }

  private GetDefaultState(stateId: stateId): FSMState | undefined {
    const state = this._stateMappings.get(stateId);
    if (state == undefined) {
      return undefined;
    }
    const defaultStateId = state.getDefault();

    if (defaultStateId != undefined) {
      return this._states.get(defaultStateId);
    }

    return undefined;
  }

  private changeState(state: FSMState, ia?: InputAction) {
    this._stateFrameCount = 0;
    this._currentState.OnExit?.(this._player);
    this._currentState = state;
    this._player.SetCurrentFSMStateId(state.StateId);
    this._currentState.OnEnter?.(this._player, ia);
  }

  private updateState(inputAction: InputAction) {
    this._currentState.OnUpdate?.(this._player, inputAction);
    this._stateFrameCount++;
  }

  // private updateStateFromWorld() {
  //   this._currentState.OnUpdate?.(this._player);
  //   this._stateFrameCount++;
  // }

  private IsDefaultFrame(): boolean {
    const fl = this._currentState.FrameLength;
    if (fl === undefined) {
      return false;
    }

    if (fl == this._stateFrameCount) {
      return true;
    }

    return false;
  }

  public get CurrentStateName(): string {
    return this._currentState.StateName;
  }
}
