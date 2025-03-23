import { InputStorageManagerLocal } from '../../JavaScript/game/engine/engine-state-management/Managers';
import { GameEvents } from '../../JavaScript/game/FSM/FiniteState';
import { InputAction, NewInputAction } from '../../JavaScript/game/loops/Input';

test('input storage manager', () => {
  const ism = new InputStorageManagerLocal<InputAction>();

  const firstInput = NewInputAction();
  const secondInput = NewInputAction();
  secondInput.Action = GameEvents.jump;

  ism.StoreLocalInputForP1(0, firstInput);
  ism.StoreLocalInputForP1(1, secondInput);

  expect(ism.GetP1LocalInputForFrame(0).Action).toBe(GameEvents.idle);
  expect(ism.GetP1LocalInputForFrame(1).Action).toBe(GameEvents.jump);
});

// npx jest
