import { VecPool } from '../../JavaScript/game/pools/VecResultPool';

test('VecResultPool Test', () => {
  const SUT = new VecPool(1000);
  const result = SUT.Rent();

  expect(result.X).toBe(0);
  expect(result.Y).toBe(0);

  result._setXY(1, 2);

  expect(result.X).toBe(1);
  expect(result.Y).toBe(2);

  SUT.Zero();

  let result2 = SUT.Rent();

  expect(result2.X).toBe(0);
  expect(result2.Y).toBe(0);
});
