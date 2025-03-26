import { Jazz } from '../../JavaScript/game/engine/jazz';
import { GameEvents, STATES } from '../../JavaScript/game/FSM/FiniteState';
import { InputAction } from '../../JavaScript/game/loops/Input';
import { RenderData } from '../../JavaScript/game/render/debug-2d';

test('test', () => {
  const renderFunc = (rd: RenderData) => {};
  const engine = new Jazz(renderFunc);
  engine.Init(); // Stage is at 600, 450
  engine.World?.player?.SetPlayerInitialPosition(610, 200);
  engine.World?.player?.StateMachine?.SetInitialState(STATES.N_FALL);

  const ia: InputAction = {
    Action: GameEvents.idle,
    LXAxsis: 0,
    LYAxsis: 0,
    RXAxis: 0,
    RYAxsis: 0,
  };
  engine.UpdateLocalInputForCurrentFrame(ia);
  engine.tick();
  engine.UpdateLocalInputForCurrentFrame(ia);
  engine.tick();
  engine.UpdateLocalInputForCurrentFrame(ia);
  engine.tick();
  engine.UpdateLocalInputForCurrentFrame(ia);
  engine.tick();
  engine.UpdateLocalInputForCurrentFrame(ia);
  engine.tick();
  engine.UpdateLocalInputForCurrentFrame(ia);
  engine.tick();

  expect(engine.World?.player?.IsGrounded()).toBeFalsy();
});

test('test fast fall to ground', () => {
  const renderFunc = (rd: RenderData) => {};
  const engine = new Jazz(renderFunc);
  engine.Init(); // Stage is at 600, 450
  engine.World?.player?.SetPlayerInitialPosition(610, 430);
  engine.World?.player?.StateMachine?.SetInitialState(STATES.N_FALL);

  let ia: InputAction = {
    Action: GameEvents.idle,
    LXAxsis: 0,
    LYAxsis: 0,
    RXAxis: 0,
    RYAxsis: 0,
  };
  engine.UpdateLocalInputForCurrentFrame(ia);
  engine.tick();

  ia.Action = GameEvents.down;

  engine.UpdateLocalInputForCurrentFrame(ia);
  engine.tick();
  engine.UpdateLocalInputForCurrentFrame(ia);
  engine.tick();
  engine.UpdateLocalInputForCurrentFrame(ia);
  engine.tick();
  engine.UpdateLocalInputForCurrentFrame(ia);
  engine.tick();
  engine.UpdateLocalInputForCurrentFrame(ia);
  engine.tick();
  engine.UpdateLocalInputForCurrentFrame(ia);
  engine.tick();
  engine.UpdateLocalInputForCurrentFrame(ia);
  engine.tick();
  engine.UpdateLocalInputForCurrentFrame(ia);
  engine.tick();

  expect(engine.World?.player?.IsGrounded()).toBeTruthy();
});
