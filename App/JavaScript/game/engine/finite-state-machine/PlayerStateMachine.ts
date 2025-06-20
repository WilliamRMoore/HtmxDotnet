import { Player } from '../player/playerOrchestrator';
import { World } from '../world/world';
import { InputAction } from '../../loops/Input';
import {
  ActionStateMappings,
  AerialAttack,
  AIR_ATK_RELATIONS,
  AIR_DODGE_RELATIONS,
  AirDodge,
  Attack,
  ATTACK_RELATIONS,
  Crouch,
  CROUCH_RELATIONS,
  Dash,
  DASH_RELATIONS,
  DASH_TURN_RELATIONS,
  DashTurn,
  DOWN_SPECIAL_RELATIONS,
  DownSpecial,
  FastFall,
  FFALL_RELATIONS,
  gameEventId,
  Helpess,
  HELPESS_RELATIONS,
  HIT_STOP_RELATIONS,
  hitStop,
  Idle,
  IDLE_STATE_RELATIONS,
  Jump,
  JUMP_RELATIONS,
  JUMP_SQUAT_RELATIONS,
  JumpSquat,
  Land,
  LAND_RELATIONS,
  Launch,
  LAUNCH_RELATIONS,
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
  Tumble,
  TUMBLE_RELATIONS,
  Turn,
  TURN_RELATIONS,
  Walk,
  WALK_RELATIONS,
} from './PlayerStates';

export type FSMState = {
  StateName: string;
  StateId: number;
  OnEnter: (p: Player, world: World) => void;
  OnUpdate: (p: Player, world: World) => void;
  OnExit: (p: Player, world: World) => void;
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
      .set(HELPESS_RELATIONS.stateId, HELPESS_RELATIONS.mappings)
      .set(ATTACK_RELATIONS.stateId, ATTACK_RELATIONS.mappings)
      .set(AIR_ATK_RELATIONS.stateId, AIR_ATK_RELATIONS.mappings)
      .set(DOWN_SPECIAL_RELATIONS.stateId, DOWN_SPECIAL_RELATIONS.mappings)
      .set(HIT_STOP_RELATIONS.stateId, HIT_STOP_RELATIONS.mappings)
      .set(TUMBLE_RELATIONS.stateId, TUMBLE_RELATIONS.mappings)
      .set(LAUNCH_RELATIONS.stateId, LAUNCH_RELATIONS.mappings)
      .set(CROUCH_RELATIONS.stateId, CROUCH_RELATIONS.mappings);

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
      .set(Helpess.StateId, Helpess)
      .set(Attack.StateId, Attack)
      .set(AerialAttack.StateId, AerialAttack)
      .set(DownSpecial.StateId, DownSpecial)
      .set(hitStop.StateId, hitStop)
      .set(Tumble.StateId, Tumble)
      .set(Launch.StateId, Launch)
      .set(Crouch.StateId, Crouch);
  }

  public SetInitialState(stateId: stateId) {
    this.changeState(this.states.get(stateId)!);
  }

  public UpdateFromWorld(gameEventId: gameEventId) {
    // world events should still have to follow mapping rules
    const state = this.GetTranslation(gameEventId);
    if (state === undefined) {
      return;
    }
    const fsmInfo = this.player.FSMInfo;

    this.changeState(state);
    fsmInfo.CurrentState.OnUpdate?.(this.player, this.world);
    fsmInfo.IncrementStateFrame();
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
    if (this.runConditional(world)) {
      return;
    }

    // if our input is a valid transition, run it
    if (this.runNext(inputAction)) {
      return;
    }

    // if we have a default state, run it
    if (this.runDefault(world)) {
      return;
    }

    // None of the above? Update current state
    this.updateState();
  }

  private runNext(inputAction: InputAction): boolean {
    const state = this.GetTranslation(inputAction.Action);

    if (state != undefined) {
      this.changeState(state);
      this.updateState();
      return true;
    }

    return false;
  }

  private runDefault(w: World): boolean {
    // Check to see if we are on a default frame
    // If not, return false
    if (this.IsDefaultFrame() == false) {
      return false;
    }

    const defaultTransition = this.GetDefaultState(
      this.player.FSMInfo.CurrentStatetId,
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

  private runConditional(world: World): boolean {
    const conditions = this.stateMappings
      .get(this.player.FSMInfo.CurrentStatetId)!
      .GetConditions();

    // We have no conditionals, return
    if (conditions === undefined) {
      return false;
    }

    const conditionalsLength = conditions.length;

    // Loop through all conditionals, if one returns a stateId, run it and return true, otherwise return false
    for (let i = 0; i < conditionalsLength; i++) {
      const stateId = RunCondition(conditions[i], world, this.player.ID);

      // Condition returned a stateId, check it
      if (stateId !== undefined) {
        const state = this.states.get(stateId);

        // stateId did not resolve, return false
        if (state == undefined) {
          console.error('StateId not found in state machine: ', stateId);
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
      this.player.FSMInfo.CurrentStatetId
    );
    const nextStateId = stateMappings?.GetMapping(gameEventId);

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

    const defaultStateConditions = stateMapping.GetDefaults();

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
    const fsmInfo = this.player.FSMInfo;
    fsmInfo.SetStateFrameToZero();
    fsmInfo.CurrentState.OnExit(this.player, this.world);
    fsmInfo.SetCurrentState(state);
    fsmInfo.CurrentState.OnEnter(this.player, this.world);
  }

  private updateState() {
    const fsmInfo = this.player.FSMInfo;
    fsmInfo.CurrentState.OnUpdate(this.player, this.world);
    fsmInfo.IncrementStateFrame();
  }

  private IsDefaultFrame(): boolean {
    const fsmInfo = this.player.FSMInfo;
    const fl = fsmInfo.GetFrameLenthOrUndefinedForCurrentState();

    if (fl === undefined) {
      return false;
    }

    if (fl == fsmInfo.CurrentStateFrame) {
      return true;
    }

    return false;
  }
}
