import { IntersectsPolygons } from '../../JavaScript/game/engine/physics/collisions';
import { FlatVec } from '../../JavaScript/game/engine/physics/vector';
import { CollisionResultPool } from '../../JavaScript/game/pools/CollisionResultPool';
import { ProjectionResultPool } from '../../JavaScript/game/pools/ProjectResultPool';
import { VecPool } from '../../JavaScript/game/pools/VecResultPool';

let poly1: Array<FlatVec>;
let poly2: Array<FlatVec>;

beforeEach(() => {
  poly1 = new Array<FlatVec>();
  poly2 = new Array<FlatVec>();

  poly1[0] = new FlatVec(0, 0);
  poly1[1] = new FlatVec(50, 0);
  poly1[2] = new FlatVec(50, 50);
  poly1[3] = new FlatVec(0, 50);

  poly2[0] = new FlatVec(0, 0);
  poly2[1] = new FlatVec(50, 0);
  poly2[2] = new FlatVec(50, 50);
  poly2[3] = new FlatVec(0, 50);
});

test('Test Move', () => {
  let vecPool = new VecPool(100);
  let p1 = Move(poly1, new FlatVec(100, 0), vecPool);

  expect(p1[0].x).toBe(100);
  expect(p1[1].x).toBe(150);
});

test('IntersectsPolygons returns false', () => {
  let vecPool = new VecPool(100);
  let colResPool = new CollisionResultPool(100);
  let projResPool = new ProjectionResultPool(100);
  let p1 = Move(poly1, new FlatVec(100, 100), vecPool);
  let p2 = Move(poly2, new FlatVec(300, 300), vecPool);

  let res = IntersectsPolygons(p1, p2, vecPool, colResPool, projResPool);

  expect(res.collision).toBeFalsy();
});

test('IntersectsPolygons returns true', () => {
  let vecPool = new VecPool(100);
  let colResPool = new CollisionResultPool(100);
  let projResPool = new ProjectionResultPool(100);
  let p1 = Move(poly1, new FlatVec(100, 100), vecPool);
  let p2 = Move(poly2, new FlatVec(110, 100), vecPool);

  let res = IntersectsPolygons(p1, p2, vecPool, colResPool, projResPool);

  expect(res.collision).toBeTruthy();
});

function Move(poly: Array<FlatVec>, pos: FlatVec, vecPool: VecPool) {
  poly[0] = pos;
  // let posDto = VectorResultAllocator(pos.x, pos.y);
  // var dto = VectorResultAllocator();
  const posDto = vecPool.Rent()._setXY(pos.x, pos.y);
  let dto = vecPool.Rent();

  for (let i = 1; i < poly.length; i++) {
    const vert = poly[i];
    dto.SetFromFlatVec(vert);
    let res = dto.Add(posDto);
    vert.x = res.X;
    vert.y = res.Y;
  }

  return poly;
}
