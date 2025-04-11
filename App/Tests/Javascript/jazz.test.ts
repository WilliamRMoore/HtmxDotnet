import { Jazz } from '../../JavaScript/game/engine/jazz';
import {
  GameEvents,
  STATES,
} from '../../JavaScript/game/engine/finite-state-machine/PlayerStates';
import { InputAction } from '../../JavaScript/game/loops/Input';
import { RenderData } from '../../JavaScript/game/render/debug-2d';

test('test', () => {
  const renderData = new RenderData();
  const engine = new Jazz(renderData);
  engine.Init(); // Stage is at 600, 450
  engine.World?.GetPlayer?.SetPlayerInitialPosition(610, 200);
  engine.World?.GetStateMachine?.SetInitialState(STATES.N_FALL);

  const ia: InputAction = {
    Action: GameEvents.idle,
    LXAxsis: 0,
    LYAxsis: 0,
    RXAxis: 0,
    RYAxsis: 0,
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

  expect(engine.World?.GetPlayer?.IsGrounded(engine.World.Stage!)).toBeFalsy();
});

test('test fast fall to ground', () => {
  const renderData = new RenderData();
  const engine = new Jazz(renderData);
  engine.Init(); // Stage is at 600, 450
  engine.World?.GetPlayer?.SetPlayerInitialPosition(610, 430);
  engine.World?.GetStateMachine?.SetInitialState(STATES.N_FALL);

  let ia: InputAction = {
    Action: GameEvents.idle,
    LXAxsis: 0,
    LYAxsis: 0,
    RXAxis: 0,
    RYAxsis: 0,
  };
  engine.UpdateLocalInputForCurrentFrame(ia, 0);
  engine.Tick();

  ia.Action = GameEvents.down;

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

  expect(engine.World?.GetPlayer?.IsGrounded(engine.World.Stage!)).toBeTruthy();
});
