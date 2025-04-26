import {
  Player,
  PlayerHelpers,
} from '../../JavaScript/game/engine/player/playerOrchestrator';
import {
  defaultStage,
  Stage,
} from '../../JavaScript/game/engine/stage/stageComponents';
import { World } from '../../JavaScript/game/engine/world/world';
import { GAME_EVENTS } from '../../JavaScript/game/engine/finite-state-machine/PlayerStates';
import { STATES } from '../../JavaScript/game/engine/finite-state-machine/PlayerStates';
import { StateMachine } from '../../JavaScript/game/engine/finite-state-machine/PlayerStateMachine';
import { InputAction } from '../../JavaScript/game/loops/Input';

test('StateMachineShould', () => {
  const p: Player = new Player(0);
  const s: Stage = defaultStage();
  const world: World = new World();
  world.SetPlayer(p);
  world.SetStage(s);

  PlayerHelpers.SetPlayerInitialPosition(
    p,
    s.StageVerticies.GetGround()[0].X + 10,
    s.StageVerticies.GetGround()[0].Y + 0.001
  );

  const sm: StateMachine = new StateMachine(p);

  const ia: InputAction = {
    Action: GAME_EVENTS.MOVE_GE,
    LXAxsis: 0.4,
    RXAxis: 0,
    LYAxsis: 0,
    RYAxsis: 0,
    Select: false,
    Start: false,
  };

  world.localFrame = 0;
  sm.SetInitialState(STATES.IDLE_S);

  // sm.UpdateFromInput(ia, world);
  world.GetInputManager(0).StoreInputForFrame(world.localFrame, ia);

  sm.UpdateFromInput(ia, world);

  expect(p.FSMInfo.CurrentState.StateId).toBe(STATES.TURN_S);
});

test('StateMachineShould2', () => {
  const p: Player = new Player(0);
  const s: Stage = defaultStage();
  const world: World = new World();
  world.SetPlayer(p);
  world.SetStage(s);

  PlayerHelpers.SetPlayerPosition(
    p,
    s.StageVerticies.GetGround()[0].X + 10,
    s.StageVerticies.GetGround()[0].Y + 0.001
  );

  p.Flags.FaceLeft();

  const sm: StateMachine = new StateMachine(p);

  const ia: InputAction = {
    Action: GAME_EVENTS.MOVE_GE,
    LXAxsis: 0.4,
    RXAxis: 0,
    LYAxsis: 0,
    RYAxsis: 0,
    Start: false,
    Select: false,
  };

  sm.UpdateFromInput(ia, world);

  expect(p.FSMInfo.CurrentState.StateId).toBe(STATES.TURN_S);
});

function UpdateNTimes(w: World, sm: StateMachine, ia: InputAction, n: number) {
  for (let index = 0; index < n; index++) {
    w.GetInputManager(0).StoreInputForFrame(w.localFrame, ia);
    sm.UpdateFromInput(ia, w);
    w.localFrame++;
  }
}
