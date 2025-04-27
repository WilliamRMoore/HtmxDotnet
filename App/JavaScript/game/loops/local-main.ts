import { IJazz, JazzDebugger } from '../engine/jazz';
import { PlayerHelpers } from '../engine/player/playerOrchestrator';
import { STATES } from '../engine/finite-state-machine/PlayerStates';
import { DebugRenderer, resolution } from '../render/debug-2d';
import { RENDERFPS60Loop } from './FPS60LoopExecutor';
import { GetInput } from './Input';
import { World } from '../engine/world/world';
import { FlatVec } from '../engine/physics/vector';

const frameInterval = 1000 / 60;

export type GamePadIndexes = Array<number>;

export type playerControllerInfo = {
  inputIndex: number;
  playerIndex: number;
};

export function start(playerInfo: Array<playerControllerInfo>) {
  const engine = new JazzDebugger();
  const playerCount = playerInfo.length;
  const positions = [
    { X: 610, Y: 100 },
    { X: 690, Y: 100 },
  ] as Array<FlatVec>;

  if (playerCount == 1) {
    positions.pop();
  }

  engine.Init(playerCount, positions);

  //PlayerHelpers.SetPlayerInitialPosition(engine.World?.GetPlayer(0)!, 610, 100);

  for (let i = 0; i < playerCount; i++) {
    const sm = engine.World.GetStateMachine(i);
    sm?.SetInitialState(STATES.N_FALL_S);
  }

  LOGIC_LOOP(engine, playerInfo);
  RENDER_LOOP(engine.World);
}

function LOGIC_LOOP(engine: IJazz, gpInfo: Array<playerControllerInfo>) {
  const logicLoopHandle = setInterval(() => {
    logicStep(engine, gpInfo);
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

function logicStep(engine: IJazz, gamePadInfo: Array<playerControllerInfo>) {
  const gamePadCount = gamePadInfo.length;
  for (let i = 0; i < gamePadCount; i++) {
    const info = gamePadInfo[i];
    const gpI = info.inputIndex;
    const pi = info.playerIndex;
    const input = GetInput(gpI);
    engine.UpdateInputForCurrentFrame(input, pi);
  }
  engine.Tick();
}
