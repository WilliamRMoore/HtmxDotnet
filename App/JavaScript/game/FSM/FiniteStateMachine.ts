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
import { GameEvents } from '../FSM/FiniteState';
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
  ConditionalStateId?: (
    p: Player,
    inputAction: InputAction
  ) => number | undefined;
  OnEnter?: (p: Player, ia?: InputAction) => void;
  OnUpdate?: (p: Player, inputAction?: InputAction) => void;
  OnExit?: (p: Player) => void;
  Condition?: (
    p: Player,
    _previousInputAction: InputAction,
    InputAction: InputAction
  ) => stateId | undefined;
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
  private _previousInputAction: InputAction = {
    Action: GameEvents.idle,
    LXAxsis: 0,
    LYAxsis: 0,
    RXAxis: 0,
    RYAxsis: 0,
  };
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

  public UpdateFromWorld(stateId: stateId) {
    const state = this._states.get(stateId)!;

    this.changeState(state);
    this.updateStateFromWorld();
  }

  public UpdateFromInput(inputAction: InputAction): void {
    // if we have a conditional on the state, check it
    if (this.RunConditional(inputAction)) {
      return;
    }
    //we didn't meet the condition, move to next code path

    //check for default
    if (this.RunDefault(inputAction)) {
      return;
    }

    if (this.RunNext(inputAction)) {
      return;
    }

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
    if (!this.IsDefaultFrame()) {
      return false;
    }
    const defaultTransition = this.GetDefaultState(this._currentState.StateId);
    if (defaultTransition != undefined) {
      this.changeState(defaultTransition, inputAction);
      this.updateState(inputAction);
      return true;
    }
    return false;
  }

  private RunConditional(inputAction: InputAction): boolean {
    if (this._currentState.Condition) {
      // get the conditional state Id
      const condtionalStateId = this._currentState.Condition(
        this._player,
        this._previousInputAction,
        inputAction
      );

      if (condtionalStateId != undefined) {
        const stateTranslation = this._states.get(condtionalStateId);
        if (stateTranslation != undefined) {
          this.changeState(stateTranslation, inputAction);
          this.updateState(inputAction);
          return true;
        }
      }
      return false;
    }
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
    this._previousInputAction = inputAction;
  }

  private updateStateFromWorld() {
    this._currentState.OnUpdate?.(this._player);
    this._stateFrameCount++;
  }

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
}
