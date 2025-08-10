import { InputStorageManagerLocal } from '../../JavaScript/game/engine/engine-state-management/Managers';
import { GAME_EVENT_IDS } from '../../JavaScript/game/engine/player/finite-state-machine/PlayerStates';
import { InputAction, NewInputAction } from '../../JavaScript/game/loops/Input';

test('input storage manager', () => {
  const ism = new InputStorageManagerLocal<InputAction>();

  const firstInput = NewInputAction();
  const secondInput = NewInputAction();
  secondInput.Action = GAME_EVENT_IDS.JUMP_GE;

  ism.StoreInputForFrame(0, firstInput);
  ism.StoreInputForFrame(1, secondInput);

  expect(ism.GetInputForFrame(0).Action).toBe(GAME_EVENT_IDS.IDLE_GE);
  expect(ism.GetInputForFrame(1).Action).toBe(GAME_EVENT_IDS.JUMP_GE);
});

// npx jest
