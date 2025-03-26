import { Player } from '../engine/player/playerOrchestrator';
import { stateId, STATES } from '../FSM/FiniteState';
import { FSMState } from '../FSM/FiniteStateMachine';
import { InputAction } from '../loops/Input';

export const Idle = {
  StateName: 'IDLE',
  StateId: STATES.IDLE,
  Condition: (p, preIa, ia) => {
    if (p.IsGrounded() == false) {
      return undefined;
    }

    if (p.IsFacingRight() && ia.LXAxsis < 0) {
      return STATES.TURN;
    }

    if (p.IsFacingLeft() && ia.LXAxsis > 0) {
      return STATES.TURN;
    }

    return undefined;
  },
} as FSMState;

function IsTurningForRun(p: Player, prevIa: InputAction, ia: InputAction) {
  if (p.IsGrounded() == false) {
    return undefined;
  }

  const prevLax = prevIa.LXAxsis;
  const curLax = ia.LXAxsis;

  if ((prevLax < 0 && curLax > 0) || (prevLax > 0 && curLax < 0)) {
    return STATES.RUN_TURN;
  }

  if (
    (prevLax == 0 && p.IsFacingRight() && curLax < 0) ||
    (prevLax == 0 && p.IsFacingLeft() && curLax > 0)
  ) {
    return STATES.RUN_TURN;
  }

  return undefined;
}

function IsTurningForWalk(
  p: Player,
  prevIa: InputAction,
  ia: InputAction
): stateId | undefined {
  if (p.IsGrounded() == false) {
    return undefined;
  }

  const prevLax = prevIa.LXAxsis;
  const curLax = ia.LXAxsis;

  if ((prevLax < 0 && curLax > 0) || (prevLax > 0 && curLax < 0)) {
    return STATES.TURN;
  }

  if (
    (prevLax == 0 && p.IsFacingRight() && curLax < 0) ||
    (prevLax == 0 && p.IsFacingLeft() && curLax > 0)
  ) {
    return STATES.TURN;
  }

  return undefined;
}

function IsTurningForDash(
  p: Player,
  prevIa: InputAction,
  ia: InputAction
): stateId | undefined {
  if (p.IsGrounded() == false) {
    return undefined;
  }

  const prevLax = prevIa.LXAxsis;
  const curLax = ia.LXAxsis;

  if (
    (prevLax == 0 && p.IsFacingRight() && curLax < 0) ||
    (prevLax == 0 && p.IsFacingLeft() && curLax > 0)
  ) {
    return STATES.TURN;
  }

  return undefined;
}

export const StartWalk: FSMState = {
  StateName: 'START_WALK',
  StateId: STATES.START_WALK,
  FrameLength: 5,
  OnEnter: (p: Player, ia?: InputAction) => {
    if (ia != undefined) {
      if (p.IsFacingRight() && ia!.LXAxsis < 0) {
        p.ChangeDirections();
      }
      if (p.IsFacingLeft() && ia!.LXAxsis > 0) {
        p.ChangeDirections();
      }
    }
  },
  OnUpdate: (p: Player, ia?: InputAction) => {
    if (ia != undefined) {
      p.AddWalkImpulse(ia.LXAxsis);
    }
  },
  OnExit: (p: Player) => {
    console.log('Exit Start Walk');
  },
  Condition: (
    p: Player,
    prevIa: InputAction,
    ia: InputAction
  ): stateId | undefined => {
    return IsTurningForWalk(p, prevIa, ia);
  },
};

export const Walk: FSMState = {
  StateName: 'WALK',
  StateId: STATES.WALK,
  OnEnter: (p: Player) => {
    console.log('Walk');
  },
  OnUpdate: (p: Player, ia?: InputAction) => {
    if (ia != undefined) {
      p.AddWalkImpulse(ia.LXAxsis);
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
    p.ChangeDirections();
  },
};

export const Dash: FSMState = {
  StateName: 'DASH',
  StateId: STATES.DASH,
  FrameLength: 7,
  OnEnter: (p: Player) => {
    console.log('Dash');
  },
  OnUpdate: (p: Player, ia?: InputAction) => {
    p.AddDashImpulse();
  },
  OnExit: (p: Player) => {
    console.log('Exit Dash');
  },
  Condition: (
    p: Player,
    previousInput: InputAction,
    inputAction: InputAction
  ) => {
    return IsTurningForDash(p, previousInput, inputAction);
  },
};

export const DashTurn: FSMState = {
  StateName: 'DASH_TURN',
  StateId: STATES.DASH_TURN,
  FrameLength: 1,
  OnEnter: (p: Player) => {
    console.log('Dash Turn');
    p.ChangeDirections();
  },
  OnUpdate() {
    console.log('Dash Turn Update');
  },
  OnExit: (p: Player) => {
    console.log('Exit Dash Turn');
  },
};

export const StopDash: FSMState = {
  StateName: 'STOP_DASH',
  StateId: STATES.STOP_DASH,
  FrameLength: 10,

  OnEnter: (p: Player) => {
    console.log('Stop Dash');
  },
  OnExit: (p: Player) => {
    console.log('Exit Stop Dash');
  },
};

export const Run: FSMState = {
  StateName: 'RUN',
  StateId: STATES.RUN,
  OnEnter: (p: Player) => {
    console.log('Run');
  },
  OnUpdate: (p: Player, ia?: InputAction) => {
    if (ia != undefined) {
      p.AddRunImpulse(ia.LXAxsis);
    }
  },
  OnExit: (p: Player) => {
    console.log('Exit Run');
  },
  Condition: (p: Player, prevIa: InputAction, curIa: InputAction) => {
    return IsTurningForRun(p, prevIa, curIa);
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
    p.ChangeDirections();
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
  FrameLength: 5,
  OnEnter: (p: Player) => {
    p.AddToPlayerYPosition(-0.5);
    p.AddJumpImpulse();
    console.log('Jump');
  },
  OnExit: (p: Player) => {
    console.log('Exit Jump');
  },
};

export const NeutralFall: FSMState = {
  StateName: 'NFALL',
  StateId: STATES.N_FALL,
};

export const FastFall: FSMState = {
  StateName: 'FastFall',
  StateId: STATES.F_FALL,
  OnEnter: (p: Player) => {
    p.FastFallOn();
  },
  OnExit: (p: Player) => {
    p.FastFallOff();
  },
};

export const Land: FSMState = {
  StateName: 'Land',
  StateId: STATES.LAND,
};

export const SoftLand: FSMState = {
  StateName: 'SoftLand',
  StateId: STATES.SOFT_LAND,
};
