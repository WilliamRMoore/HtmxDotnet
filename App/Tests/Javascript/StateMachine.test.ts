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
import { GameEvents } from '../../JavaScript/game/engine/finite-state-machine/PlayerStates';
import { STATES } from '../../JavaScript/game/engine/finite-state-machine/PlayerStates';
import { StateMachine } from '../../JavaScript/game/engine/finite-state-machine/PlayerStateMachine';
import { InputAction } from '../../JavaScript/game/loops/Input';

test('StateMachineShould', () => {
  const p: Player = new Player(0);
  const s: Stage = defaultStage();
  const world: World = new World();
  world.SetPlayer(p);
  world.SetStage(s);

  p.SetPlayerInitialPosition(
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
  sm.SetInitialState(STATES.IDLE);

  // sm.UpdateFromInput(ia, world);
  world.GetInputManager(0).StoreInputForFrame(world.localFrame, ia);

  sm.UpdateFromInput(ia, world);

  expect(p.GetCurrentFSMStateId()).toBe(STATES.TURN);
});

test('StateMachineShould2', () => {
  const p: Player = new Player(0);
  const s: Stage = defaultStage();
  const world: World = new World();
  world.SetPlayer(p);
  world.SetStage(s);

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

  sm.UpdateFromInput(ia, world);

  expect(p.GetCurrentFSMStateId()).toBe(STATES.TURN);
});

function UpdateNTimes(w: World, sm: StateMachine, ia: InputAction, n: number) {
  for (let index = 0; index < n; index++) {
    w.GetInputManager(0).StoreInputForFrame(w.localFrame, ia);
    sm.UpdateFromInput(ia, w);
    w.localFrame++;
  }
}
