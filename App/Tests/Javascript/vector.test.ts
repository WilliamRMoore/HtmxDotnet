import {
  FlatVec,
  SET_POOL,
  VectorAdder,
  VectorResultAllocator,
  ZERO_VR_POOL,
} from '../../JavaScript/game/engine/physics/vector';
import { VecResultPool } from '../../JavaScript/game/pools/VecResultPool';

test('vec library pool test', () => {
  const vrp = new VecResultPool(10);

  SET_POOL(vrp);

  const vt1 = VectorResultAllocator(1, 2);
  const vt2 = VectorResultAllocator(3, 4);

  const update = new FlatVec(0, 0);

  const result = VectorAdder(vt1, vt2);

  update.x = result.X;
  update.y = result.Y;

  expect(result.X).toBe(4);
  expect(result.Y).toBe(6);

  ZERO_VR_POOL();

  const result2 = VectorResultAllocator();

  expect(result2.X).toBe(0);
  expect(result2.Y).toBe(0);
});
