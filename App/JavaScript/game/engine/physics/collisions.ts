import { CollisionResult, ICollisionResult } from '../../pools/CollisionResult';
import { Pool } from '../../pools/Pool';
import { IProjectionResult, ProjectionResult } from '../../pools/ProjectResult';
import { PooledVector } from '../../pools/VecResult';
import { FlatVec } from './vector';

export function IntersectsPolygons(
  verticiesA: Array<FlatVec>,
  verticiesB: Array<FlatVec>,
  vecPool: Pool<PooledVector>,
  colResPool: Pool<CollisionResult>,
  projResPool: Pool<ProjectionResult>
): ICollisionResult {
  let normal = vecPool.Rent();
  let depth = Number.MAX_SAFE_INTEGER;

  const verticiesAVec = vecPool.Rent();
  const verticiesBVec = vecPool.Rent();

  for (let i = 0; i < verticiesA.length; i++) {
    // Go through verticies in clockwise order.
    const va = verticiesA[i];
    const vb = verticiesA[(i + 1) % verticiesA.length];
    verticiesAVec._setXY(va.x, va.y);
    verticiesBVec._setXY(vb.x, vb.y);
    let axis = verticiesBVec
      .Subtract(verticiesAVec)
      ._setY(-verticiesBVec.Y)
      .Normalize();
    // Project verticies for both polygons.
    const vaProj = ProjectVerticies(verticiesA, axis, vecPool, projResPool);
    const vbProj = ProjectVerticies(verticiesB, axis, vecPool, projResPool);

    if (vaProj.Min >= vbProj.Max || vbProj.Min >= vaProj.Max) {
      //return { collision: false, normal: null, depth: null } as collisionResult;
      const res = colResPool.Rent();
      res._setCollisionFalse();
      return res;
    }

    const axisDepth = Math.min(
      vbProj.Max - vaProj.Min,
      vaProj.Max - vbProj.Min
    );

    if (axisDepth < depth) {
      depth = axisDepth;
      normal._setX(axis.X)._setY(axis.Y);
    }
  }

  verticiesAVec._setXY(0, 0);
  verticiesBVec._setXY(0, 0);

  for (let i = 0; i < verticiesB.length; i++) {
    const va = verticiesB[i];
    const vb = verticiesB[(i + 1) % verticiesB.length]; // Go through verticies in clockwise order.
    verticiesAVec._setXY(va.x, va.y);
    verticiesBVec._setXY(vb.x, vb.y);
    const axis = verticiesBVec
      .Subtract(verticiesAVec)
      ._setY(-verticiesBVec.Y)
      .Normalize();
    // Project verticies for both polygons.
    const vaProj = ProjectVerticies(verticiesA, axis, vecPool, projResPool);
    const vbProj = ProjectVerticies(verticiesB, axis, vecPool, projResPool);

    if (vaProj.Min >= vbProj.Max || vbProj.Min >= vaProj.Max) {
      const res = colResPool.Rent();
      res._setCollisionFalse();
      return res;
      //return { collision: false, normal: null, depth: null } as collisionResult;
    }
    const axisDepth = Math.min(
      vbProj.Max - vaProj.Min,
      vaProj.Max - vbProj.Min
    );
    if (axisDepth < depth) {
      depth = axisDepth;
      normal._setX(axis.X)._setY(axis.Y);
    }
  }

  const centerA = FindArithemticMean(verticiesA, vecPool.Rent());
  const centerB = FindArithemticMean(verticiesB, vecPool.Rent());

  const direction = centerB.Subtract(centerA);

  if (direction.DotProduct(normal) < 0) {
    normal.Negate();
  }

  const res = colResPool.Rent();
  res._setCollisionTrue(normal.X, normal.Y, depth);
  return res;
  //return { collision: true, normal, depth } as collisionResult;
}

// suplimental functions ====================================

function FindArithemticMean(
  verticies: Array<FlatVec>,
  pooledVec: PooledVector
): PooledVector {
  let sumX = 0;
  let sumY = 0;
  const vertLength = verticies.length;

  for (let index = 0; index < vertLength; index++) {
    const v = verticies[index];
    sumX += v.x;
    sumY += v.y;
  }

  return pooledVec._setXY(sumX, sumY).Divide(vertLength);
}

function ProjectVerticies(
  verticies: Array<FlatVec>,
  axis: PooledVector,
  vecPool: Pool<PooledVector>,
  projResPool: Pool<ProjectionResult>
): IProjectionResult {
  let min = Number.MAX_SAFE_INTEGER;
  let max = Number.MIN_SAFE_INTEGER;

  const vRes = vecPool.Rent();

  for (let i = 0; i < verticies.length; i++) {
    const v = verticies[i];
    vRes._setXY(v.x, v.y);

    // get the projection for the given axis
    const projection = vRes.DotProduct(axis);

    // set the minimum projection
    if (projection < min) {
      min = projection;
    }
    //set the maximum projection
    if (projection > max) {
      max = projection;
    }
  }

  let result = projResPool.Rent();
  result._setMinMax(min, max);
  return result;
}
