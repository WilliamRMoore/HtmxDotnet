import { IJazz, Jazz, JazzDebugger } from '../engine/jazz';
import { STATES } from '../FSM/FiniteState';
import { NewMessageFromLocalInput } from '../network/protocol';
import { DebugRenderer, RenderData, resolution } from '../render/debug-2d';
import { RENDERFPS60Loop } from './FPS60LoopExecutor';
import { GetInput, listenForGamePadInput } from './Input';

let renderData = new RenderData();
const frameInterval = 1000 / 60;

export function start(localPlayerGamePadIndex: number = 0) {
  debugger;
  INPUT_LOOP(localPlayerGamePadIndex);
  LOGIC_LOOP();
  RENDER_LOOP();
}

function INPUT_LOOP(gamePadIndex: number) {
  //const p1Controller = getPlayerControllerIndex();
  listenForGamePadInput(gamePadIndex);
}

function LOGIC_LOOP() {
  //const engine = new Jazz(renderData);
  const engine = new JazzDebugger(renderData);
  engine.Init();
  engine.World?.Player?.SetPlayerInitialPosition(610, 100);
  engine.World?.StateMachine?.SetInitialState(STATES.N_FALL);
  const logicLoopHandle = setInterval(() => {
    logicStep(engine);
  }, frameInterval);
}

function RENDER_LOOP() {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const resolution: resolution = { x: 1920, y: 1080 };
  const dbRenderer = new DebugRenderer(canvas, resolution);
  RENDERFPS60Loop(() => {
    dbRenderer.render(renderData);
  });
}

// function getPlayerControllerIndex(): number {
//   return 0;
// }

function logicStep(engine: IJazz) {
  const input = GetInput();
  //const message = NewMessageFromLocalInput(input, localFrame);
  engine.UpdateLocalInputForCurrentFrame(input, 0);
  engine.Tick();
}
