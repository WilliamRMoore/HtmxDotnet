import { Jazz } from '../../JavaScript/game/engine/jazz';
import {
  GAME_EVENTS,
  STATES,
} from '../../JavaScript/game/engine/finite-state-machine/PlayerStates';
import { InputAction } from '../../JavaScript/game/loops/Input';
import { RenderData } from '../../JavaScript/game/render/debug-2d';
import { PlayerHelpers } from '../../JavaScript/game/engine/player/playerOrchestrator';

test('test', () => {
  const renderData = new RenderData(1);
  const engine = new Jazz(renderData);
  engine.Init(1); // Stage is at 600, 450
  PlayerHelpers.SetPlayerInitialPosition(
    engine.World?.GetPlayer?.(0)!,
    610,
    200
  );
  engine.World!.GetStateMachine(0)!.SetInitialState(STATES.N_FALL_S);

  const ia: InputAction = {
    Action: GAME_EVENTS.IDLE_GE,
    LXAxsis: 0,
    LYAxsis: 0,
    RXAxis: 0,
    RYAxsis: 0,
    Start: false,
    Select: false,
  };
  engine.UpdateLocalInputForCurrentFrame(ia, 0);
  engine.Tick();
  engine.UpdateLocalInputForCurrentFrame(ia, 0);
  engine.Tick();
  engine.UpdateLocalInputForCurrentFrame(ia, 0);
  engine.Tick();
  engine.UpdateLocalInputForCurrentFrame(ia, 0);
  engine.Tick();
  engine.UpdateLocalInputForCurrentFrame(ia, 0);
  engine.Tick();
  engine.UpdateLocalInputForCurrentFrame(ia, 0);
  engine.Tick();

  const groundedFunc = PlayerHelpers.IsPlayerGroundedOnStage;
  expect(
    groundedFunc(engine.World!.GetPlayer(0)!, engine.World!.Stage!)
  ).toBeFalsy();
});

test('test fast fall to ground', () => {
  const renderData = new RenderData(1);
  const engine = new Jazz(renderData);
  engine.Init(1); // Stage is at 600, 450
  PlayerHelpers.SetPlayerInitialPosition(
    engine.World?.GetPlayer?.(0)!,
    610,
    430
  );
  engine.World!.GetStateMachine(0)!.SetInitialState(STATES.N_FALL_S);

  let ia: InputAction = {
    Action: GAME_EVENTS.IDLE_GE,
    LXAxsis: 0,
    LYAxsis: 0,
    RXAxis: 0,
    RYAxsis: 0,
    Start: false,
    Select: false,
  };
  engine.UpdateLocalInputForCurrentFrame(ia, 0);
  engine.Tick();

  ia.Action = GAME_EVENTS.DOWN_GE;

  engine.UpdateLocalInputForCurrentFrame(ia, 0);
  engine.Tick();
  engine.UpdateLocalInputForCurrentFrame(ia, 0);
  engine.Tick();
  engine.UpdateLocalInputForCurrentFrame(ia, 0);
  engine.Tick();
  engine.UpdateLocalInputForCurrentFrame(ia, 0);
  engine.Tick();
  engine.UpdateLocalInputForCurrentFrame(ia, 0);
  engine.Tick();
  engine.UpdateLocalInputForCurrentFrame(ia, 0);
  engine.Tick();
  engine.UpdateLocalInputForCurrentFrame(ia, 0);
  engine.Tick();
  engine.UpdateLocalInputForCurrentFrame(ia, 0);
  engine.Tick();

  const groundedFunc = PlayerHelpers.IsPlayerGroundedOnStage;
  expect(
    groundedFunc(engine.World!.GetPlayer(0)!, engine.World!.Stage!)
  ).toBeTruthy();
});
