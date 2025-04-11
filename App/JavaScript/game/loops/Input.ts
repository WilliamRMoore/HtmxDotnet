import { GameEvents } from '../engine/finite-state-machine/PlayerStates';

export type InputAction = {
  Action: number;
  LXAxsis: number;
  LYAxsis: number;
  RXAxis: number;
  RYAxsis: number;
  Start: boolean;
  Select: boolean;
};

export class GamePadInput {
  LXAxis: number = 0;
  LYAxis: number = 0;
  RXAxis: number = 0;
  RYAxis: number = 0;

  action: boolean = false;
  special: boolean = false;
  jump: boolean = false;
  lb: boolean = false;
  rb: boolean = false;
  lt: boolean = false;
  rt: boolean = false;

  dpUp: boolean = false;
  dpDown: boolean = false;
  dpRight: boolean = false;
  dpLeft: boolean = false;

  start: boolean = false;
  select: boolean = false;

  Clear() {
    this.LXAxis = 0;
    this.LYAxis = 0;
    this.RXAxis = 0;
    this.RYAxis = 0;

    this.action = false;
    this.special = false;
    this.jump = false;
    this.lb = false;
    this.rb = false;
    this.lt = false;
    this.rt = false;

    this.dpUp = false;
    this.dpDown = false;
    this.dpLeft = false;
    this.dpRight = false;

    this.start = false;
    this.select = false;
  }
}

const currentInput = new GamePadInput();

export function listenForGamePadInput(index: number = 0) {
  setInterval(() => pollInput(index), 4);
}

function pollInput(index: number) {
  const gp = navigator.getGamepads()[index];
  if (gp && gp.connected) {
    readInput(gp);
  }
}

function readInput(gamePad: Gamepad) {
  currentInput.Clear();
  let lx = setDeadzone(gamePad.axes[0]);
  let ly = setDeadzone(gamePad.axes[1]);
  let rx = setDeadzone(gamePad.axes[2]);
  let ry = setDeadzone(gamePad.axes[3]);

  [lx, ly] = clampStick(lx, ly);
  [rx, ry] = clampStick(rx, ry);

  // controls are inverted, flip values.
  if (ly != 0) {
    ly *= -1;
  }

  if (ry != 0) {
    ry *= -1;
  }

  currentInput.LXAxis = lx;
  currentInput.LYAxis = ly;
  currentInput.RXAxis = rx;
  currentInput.RYAxis = ry;

  currentInput.action = gamePad.buttons[0].pressed;
  currentInput.special = gamePad.buttons[2].pressed;
  currentInput.jump = gamePad.buttons[1].pressed || gamePad.buttons[3].pressed;
  currentInput.lb = gamePad.buttons[4].pressed;
  currentInput.rb = gamePad.buttons[5].pressed;
  currentInput.lt = gamePad.buttons[6].pressed;
  currentInput.rt = gamePad.buttons[7].pressed;

  currentInput.dpUp = gamePad.buttons[12].pressed;
  currentInput.dpDown = gamePad.buttons[13].pressed;
  currentInput.dpLeft = gamePad.buttons[14].pressed;
  currentInput.dpRight = gamePad.buttons[15].pressed;

  currentInput.start = gamePad.buttons[9].pressed;
  currentInput.select = gamePad.buttons[8].pressed;
}

export function GetInput(): InputAction {
  return transcribeInput(currentInput);
}

function transcribeInput(input: GamePadInput) {
  // Button priority is as follows: special > attack > right stick > grab > guard > jump
  const LXAxis = input.LXAxis;
  const LYAxis = input.LYAxis;
  const RXAxis = input.RXAxis;
  const RYAxis = input.RYAxis;
  const inputAction = NewInputAction();

  inputAction.LXAxsis = LXAxis;
  inputAction.LYAxsis = LYAxis;
  inputAction.RXAxis = RXAxis;
  inputAction.RYAxsis = RYAxis;
  inputAction.Start = input.start;
  inputAction.Select = input.select;

  // special was pressed
  if (input.special) {
    // Is it a special on the y axis?
    if (Math.abs(LYAxis) > Math.abs(LXAxis)) {
      if (LYAxis > 0) {
        inputAction.Action = GameEvents.upSpecial;
        return inputAction;
      }
      inputAction.Action = GameEvents.downSpecial;
      return inputAction;
    }
    // Is it a special on the x axis?
    if (LXAxis != 0) {
      inputAction.Action = GameEvents.sideSpecial;
      return inputAction;
    }

    // It is a nuetral special
    inputAction.Action = GameEvents.special;
    return inputAction;
  }

  // Action was pressed
  if (input.action) {
    // Y axis?
    if (Math.abs(LYAxis) > Math.abs(LXAxis)) {
      if (LYAxis > 0) {
        inputAction.Action = GameEvents.upAttack;
        return inputAction;
      }
      inputAction.Action = GameEvents.downAttack;
      return inputAction;
    }

    if (LXAxis != 0) {
      inputAction.Action = GameEvents.sideAttack;
      return inputAction;
    }
    inputAction.Action = GameEvents.attack;
    return inputAction;
  }

  // Right stick was used
  // Right stick more horizontal than vertical
  if (Math.abs(RXAxis) > Math.abs(RYAxis)) {
    inputAction.Action = GameEvents.sideAttack;
    return inputAction;
  }

  // Right stick was used
  // Right stick more vertical than horrizontal
  if (Math.abs(RYAxis) > Math.abs(RXAxis)) {
    if (RYAxis > 0) {
      inputAction.Action = GameEvents.upAttack;
      return inputAction;
    }
    inputAction.Action = GameEvents.downAttack;
    return inputAction;
  }

  // Grab was pressed
  if (input.rb) {
    inputAction.Action = GameEvents.grab;
    return inputAction;
  }

  // Guard was pressed
  if (input.rt || input.lt) {
    inputAction.Action = GameEvents.guard;
    return inputAction;
  }

  // Jump was pressed
  if (input.jump) {
    inputAction.Action = GameEvents.jump;
    return inputAction;
  }

  if (input.LYAxis < 0.5) {
    inputAction.Action = GameEvents.down;
  }

  if (Math.abs(input.LXAxis) > 0) {
    inputAction.Action =
      Math.abs(input.LXAxis) > 0.6 ? GameEvents.moveFast : GameEvents.move;
    return inputAction;
  }

  // Nothing was pressed
  inputAction.Action = GameEvents.idle;
  return inputAction;
}

function setDeadzone(v: number) {
  const DEADZONE = 0.5;

  if (Math.abs(v) < DEADZONE) {
    v = 0;
  } else {
    v = v - Math.sign(v) * DEADZONE;

    v /= 1.0 - DEADZONE;
  }

  return v;
}

function clampStick(x: number, y: number) {
  let m = Math.sqrt(x * x + y * y);

  if (m > 1) {
    x /= m;
    y /= m;
  }

  return [x, y];
}

export function NewInputAction() {
  return {
    Action: GameEvents.idle,
    LXAxsis: 0,
    LYAxsis: 0,
    RXAxis: 0,
    RYAxsis: 0,
  } as InputAction;
}
