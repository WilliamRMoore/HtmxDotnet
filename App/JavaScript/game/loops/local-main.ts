import { IJazz, JazzDebugger } from '../engine/jazz';
import { PlayerHelpers } from '../engine/player/playerOrchestrator';
import { STATES } from '../engine/finite-state-machine/PlayerStates';
import { DebugRenderer, RenderData, resolution } from '../render/debug-2d';
import { RENDERFPS60Loop } from './FPS60LoopExecutor';
import { GetInput, listenForGamePadInput } from './Input';

let renderData = new RenderData(1);
const frameInterval = 1000 / 60;

export type GamePadIndexes = Array<number>;

export function start(localPlayerGamePadIndex: number) {
  INPUT_LOOP(localPlayerGamePadIndex);
  LOGIC_LOOP(1);
  RENDER_LOOP();
}

function INPUT_LOOP(gamePadIndex: number) {
  listenForGamePadInput(gamePadIndex);
}

function LOGIC_LOOP(numberOfPlayers: number = 1) {
  //const engine = new Jazz(renderData);
  const engine = new JazzDebugger(renderData);
  engine.Init(numberOfPlayers);
  PlayerHelpers.SetPlayerInitialPosition(engine.World?.GetPlayer(0)!, 610, 100);
  engine.World?.GetStateMachine(0)?.SetInitialState(STATES.N_FALL);
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

function logicStep(engine: IJazz) {
  const input = GetInput();
  engine.UpdateLocalInputForCurrentFrame(input, 0);
  engine.Tick();
}
