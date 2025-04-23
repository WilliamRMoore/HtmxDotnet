import { IJazz, JazzDebugger } from '../engine/jazz';
import { PlayerHelpers } from '../engine/player/playerOrchestrator';
import { STATES } from '../engine/finite-state-machine/PlayerStates';
import { DebugRenderer, resolution } from '../render/debug-2d';
import { RENDERFPS60Loop } from './FPS60LoopExecutor';
import { GetInput } from './Input';
import { World } from '../engine/world/world';

const frameInterval = 1000 / 60;

export type GamePadIndexes = Array<number>;

export function start(localPlayerGamePadIndex: number) {
  //INPUT_LOOP(localPlayerGamePadIndex);
  const engine = new JazzDebugger();
  engine.Init(1);
  PlayerHelpers.SetPlayerInitialPosition(engine.World?.GetPlayer(0)!, 610, 100);
  engine.World?.GetStateMachine(0)?.SetInitialState(STATES.N_FALL);
  LOGIC_LOOP(engine, localPlayerGamePadIndex);
  RENDER_LOOP(engine.World);
}

// function INPUT_LOOP(gamePadIndex: number) {
//   listenForGamePadInput(gamePadIndex);
// }

function LOGIC_LOOP(engine: IJazz, gamePadIndex: number) {
  const logicLoopHandle = setInterval(() => {
    logicStep(engine, gamePadIndex);
  }, frameInterval);
}

function RENDER_LOOP(world: World) {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const resolution: resolution = { x: 1920, y: 1080 };
  const dbRenderer = new DebugRenderer(canvas, resolution);
  RENDERFPS60Loop((alpha: number) => {
    dbRenderer.render(world, alpha);
  });
}

function logicStep(engine: IJazz, gamePadIndex: number) {
  const input = GetInput(gamePadIndex);
  engine.UpdateLocalInputForCurrentFrame(input, 0);
  engine.Tick();
}
