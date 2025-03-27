import {
  Dash,
  StartWalk,
  Turn,
} from '../../JavaScript/game/CharacterStates/TestCharacterStates';
import { Player } from '../../JavaScript/game/engine/player/playerOrchestrator';
import {
  defaultStage,
  Stage,
} from '../../JavaScript/game/engine/stage/stageComponents';
import { World } from '../../JavaScript/game/engine/world/world';
import { GameEvents } from '../../JavaScript/game/FSM/FiniteState';
import { STATES } from '../../JavaScript/game/FSM/FiniteState';
import { StateMachine } from '../../JavaScript/game/FSM/FiniteStateMachine';
import { InputAction } from '../../JavaScript/game/loops/Input';

test('StateMachineShould', () => {
  const p: Player = new Player(0);
  const s: Stage = defaultStage();
  const world: World = new World();
  world.SetPlayer(p);
  world.SetStage(s);
  p.SetWorld(world);

  p.SetPlayerPostion(
    s.StageVerticies.GetGround()[0].x + 10,
    s.StageVerticies.GetGround()[0].y + 0.001
  );

  const sm: StateMachine = new StateMachine(p);

  const ia: InputAction = {
    Action: GameEvents.move,
    LXAxsis: 0.4,
    RXAxis: 0,
    LYAxsis: 0,
    RYAxsis: 0,
  };

  world.localFrame = 0;

  sm.UpdateFromInput(ia);

  expect(p.GetCurrentFSMStateId()).toBe(STATES.TURN);

  world.localFrame = 1;

  UpdateNTimes(world, sm, ia, Turn.FrameLength!);

  ia.Action = GameEvents.moveFast;
  ia.LXAxsis = 1;

  sm.UpdateFromInput(ia);

  expect(p.GetCurrentFSMStateId()).toBe(STATES.DASH);

  UpdateNTimes(world, sm, ia, Dash.FrameLength!);

  expect(p.GetCurrentFSMStateId()).toBe(STATES.RUN);
});

test('StateMachineShould2', () => {
  const p: Player = new Player(0);
  const s: Stage = defaultStage();
  const world: World = new World();
  world.SetPlayer(p);
  world.SetStage(s);
  p.SetWorld(world);

  p.SetPlayerPostion(
    s.StageVerticies.GetGround()[0].x + 10,
    s.StageVerticies.GetGround()[0].y + 0.001
  );

  p.FaceLeft();

  const sm: StateMachine = new StateMachine(p);

  const ia: InputAction = {
    Action: GameEvents.move,
    LXAxsis: 0.4,
    RXAxis: 0,
    LYAxsis: 0,
    RYAxsis: 0,
  };

  sm.UpdateFromInput(ia);

  expect(p.GetCurrentFSMStateId()).toBe(STATES.TURN);
});

function UpdateNTimes(w: World, sm: StateMachine, ia: InputAction, n: number) {
  for (let index = 0; index < n; index++) {
    sm.UpdateFromInput(ia);
    w.localFrame++;
  }
}
