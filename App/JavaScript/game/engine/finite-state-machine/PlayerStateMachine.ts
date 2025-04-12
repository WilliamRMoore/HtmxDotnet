import { Player } from '../player/playerOrchestrator';
import { World } from '../world/world';
import { InputAction } from '../../loops/Input';
import {
  ActionStateMappings,
  Dash,
  DASH_RELATIONS,
  DASH_TURN_RELATIONS,
  DashTurn,
  FastFall,
  FFALL_RELATIONS,
  gameEventId,
  Idle,
  IDLE_STATE_RELATIONS,
  Jump,
  JUMP_RELATIONS,
  JUMP_SQUAT_RELATIONS,
  JumpSquat,
  Land,
  LAND_RELATIONS,
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
  FrameLength?: number;
  InteruptFrame?: number;
  OnEnter?: (p: Player, ia?: InputAction) => void;
  OnUpdate?: (p: Player, inputAction?: InputAction) => void;
  OnExit?: (p: Player) => void;
};

export class StateMachine {
  private player: Player;
  private stateMappings: Map<stateId, ActionStateMappings> = new Map();
  private states: Map<stateId, FSMState> = new Map();

  constructor(p: Player) {
    this.player = p;
    this.player.FSMInfoComponent.SetCurrentState(Idle);
    this.stateMappings.set(
      IDLE_STATE_RELATIONS.stateId,
      IDLE_STATE_RELATIONS.mappings
    );
    this.stateMappings.set(
      START_WALK_RELATIONS.stateId,
      START_WALK_RELATIONS.mappings
    );
    this.stateMappings.set(TURN_RELATIONS.stateId, TURN_RELATIONS.mappings);
    this.stateMappings.set(WALK_RELATIONS.stateId, WALK_RELATIONS.mappings);
    this.stateMappings.set(DASH_RELATIONS.stateId, DASH_RELATIONS.mappings);
    this.stateMappings.set(
      DASH_TURN_RELATIONS.stateId,
      DASH_TURN_RELATIONS.mappings
    );
    this.stateMappings.set(RUN_RELATIONS.stateId, RUN_RELATIONS.mappings);
    this.stateMappings.set(
      RUN_TURN_RELATIONS.stateId,
      RUN_TURN_RELATIONS.mappings
    );
    this.stateMappings.set(
      STOP_RUN_RELATIONS.stateId,
      STOP_RUN_RELATIONS.mappings
    );
    this.stateMappings.set(
      JUMP_SQUAT_RELATIONS.stateId,
      JUMP_SQUAT_RELATIONS.mappings
    );
    this.stateMappings.set(JUMP_RELATIONS.stateId, JUMP_RELATIONS.mappings);
    this.stateMappings.set(NFALL_RELATIONS.stateId, NFALL_RELATIONS.mappings);
    this.stateMappings.set(FFALL_RELATIONS.stateId, FFALL_RELATIONS.mappings);
    this.stateMappings.set(LAND_RELATIONS.stateId, LAND_RELATIONS.mappings);
    this.stateMappings.set(
      SOFT_LAND_RELATIONS.stateId,
      SOFT_LAND_RELATIONS.mappings
    );
    this.states.set(Idle.StateId, Idle);
    this.states.set(StartWalk.StateId, StartWalk);
    this.states.set(Turn.StateId, Turn);
    this.states.set(Walk.StateId, Walk);
    this.states.set(Run.StateId, Run);
    this.states.set(RunTurn.StateId, RunTurn);
    this.states.set(RunStop.StateId, RunStop);
    this.states.set(Dash.StateId, Dash);
    this.states.set(DashTurn.StateId, DashTurn);
    this.states.set(JumpSquat.StateId, JumpSquat);
    this.states.set(Jump.StateId, Jump);
    this.states.set(NeutralFall.StateId, NeutralFall);
    this.states.set(FastFall.StateId, FastFall);
    this.states.set(Land.StateId, Land);
    this.states.set(SoftLand.StateId, SoftLand);
  }

  public SetInitialState(stateId: stateId) {
    this.changeState(this.states.get(stateId)!);
  }

  public UpdateFromWorld(gameEventId: gameEventId) {
    // world events should still have to follow mapping rules
    const state = this.GetTranslation(gameEventId);
    if (state != undefined) {
      const fsmInfo = this.player.FSMInfoComponent;

      this.changeState(state);
      fsmInfo.CurrentState.OnUpdate?.(this.player);
      fsmInfo.IncrementStateFrame();
    }
  }

  public ForceState(sateId: stateId) {
    //ignore mapping rules and force a state change
    const state = this.states.get(sateId);

    if (state == undefined) {
      return;
    }

    const fsmInfo = this.player.FSMInfoComponent;

    this.changeState(state);
    fsmInfo.CurrentState.OnUpdate?.(this.player);
    fsmInfo.IncrementStateFrame();
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
    if (this.RunDefault(inputAction, world)) {
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

  private RunDefault(inputAction: InputAction, w: World): boolean {
    // Check to see if we are on a default frame
    // If not, return false
    if (!this.IsDefaultFrame()) {
      return false;
    }

    const defaultTransition = this.GetDefaultState(
      this.player.FSMInfoComponent.CurrentState.StateId,
      w
    );

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
    const mappings = this.stateMappings.get(
      this.player.FSMInfoComponent.CurrentState.StateId
    );

    const conditions = mappings?.GetConditions();

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
        this.changeState(state, inputAction);
        this.updateState(inputAction);

        return true;
      }
    }

    // None of the conditions returned a stateId, return false
    return false;
  }

  private GetTranslation(gameEventId: gameEventId): FSMState | undefined {
    const stateMappings = this.stateMappings.get(
      this.player.FSMInfoComponent.CurrentState.StateId
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

  private changeState(state: FSMState, ia?: InputAction) {
    const p = this.player;
    const fsmInfo = p.FSMInfoComponent;
    fsmInfo.SetStateFrameToZero();
    fsmInfo.CurrentState.OnExit?.(this.player);
    fsmInfo.SetCurrentState(state);
    fsmInfo.CurrentState.OnEnter?.(this.player, ia);
  }

  private updateState(inputAction: InputAction) {
    const fsmInfo = this.player.FSMInfoComponent;
    fsmInfo.CurrentState.OnUpdate?.(this.player, inputAction);
    fsmInfo.IncrementStateFrame();
  }

  private IsDefaultFrame(): boolean {
    const fsmInfo = this.player.FSMInfoComponent;
    const fl = fsmInfo.CurrentState.FrameLength;

    if (fl === undefined) {
      return false;
    }

    if (fl == fsmInfo.CurrentStateFrame) {
      return true;
    }

    return false;
  }

  public get CurrentStateName(): string {
    return this.player.FSMInfoComponent.CurrentState.StateName ?? 'N/A';
  }
}
