import { FlatVec } from '../../JavaScript/game/engine/physics/vector';
import { VecPool } from '../../JavaScript/game/pools/VecResultPool';

test('vec library pool test', () => {
  const vrp = new VecPool(10);

  const vt1 = vrp.Rent()._setXY(1, 2);
  const vt2 = vrp.Rent()._setXY(3, 4);

  const update = new FlatVec(0, 0);

  const result = vt1.Add(vt2);

  update.x = result.X;
  update.y = result.Y;

  expect(result.X).toBe(4);
  expect(result.Y).toBe(6);

  vrp.Zero();

  const vt1Again = vrp.Rent();

  expect(vt1Again.X).toBe(0);
  expect(vt1Again.Y).toBe(0);
});
