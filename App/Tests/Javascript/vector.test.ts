import { FlatVec } from '../../JavaScript/game/engine/physics/vector';
import { Pool } from '../../JavaScript/game/pools/Pool';
import { PooledVector } from '../../JavaScript/game/pools/VecResult';

test('vec library pool test', () => {
  const vrp = new Pool<PooledVector>(10, () => new PooledVector());

  const vt1 = vrp.Rent().SetXY(1, 2);
  const vt2 = vrp.Rent().SetXY(3, 4);

  const update = new FlatVec(0, 0);

  const result = vt1.Add(vt2);

  update.X = result.X;
  update.Y = result.Y;

  expect(result.X).toBe(4);
  expect(result.Y).toBe(6);

  vrp.Zero();

  const vt1Again = vrp.Rent();

  expect(vt1Again.X).toBe(0);
  expect(vt1Again.Y).toBe(0);
});
