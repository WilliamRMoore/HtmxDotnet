import { InputStorageManagerLocal } from '../../JavaScript/game/engine/engine-state-management/Managers';
import { GameEvents } from '../../JavaScript/game/FSM/FiniteState';
import { InputAction, NewInputAction } from '../../JavaScript/game/loops/Input';

test('input storage manager', () => {
  const ism = new InputStorageManagerLocal<InputAction>();

  const firstInput = NewInputAction();
  const secondInput = NewInputAction();
  secondInput.Action = GameEvents.jump;

  ism.StoreInputForFrame(0, firstInput);
  ism.StoreInputForFrame(1, secondInput);

  expect(ism.GetInputForFrame(0).Action).toBe(GameEvents.idle);
  expect(ism.GetInputForFrame(1).Action).toBe(GameEvents.jump);
});

// npx jest
