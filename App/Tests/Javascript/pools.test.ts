import { Pool } from '../../JavaScript/game/pools/Pool.js';
import { PooledVector } from '../../JavaScript/game/pools/PooledVector.js';

test('VecResultPool Test', () => {
  const SUT = new Pool<PooledVector>(1000, () => new PooledVector());
  const result = SUT.Rent();

  expect(result.X).toBe(0);
  expect(result.Y).toBe(0);

  result.SetXY(1, 2);

  expect(result.X).toBe(1);
  expect(result.Y).toBe(2);

  SUT.Zero();

  let result2 = SUT.Rent();

  expect(result2.X).toBe(0);
  expect(result2.Y).toBe(0);
});
