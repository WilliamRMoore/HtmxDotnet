import {
  CollisionResultPool,
  ICollisionResult,
} from '../../pools/CollisionResultPool';
import {
  IProjectionResult,
  ProjectionResultPool,
} from '../../pools/ProjectResultPool';
import { IVecResult } from '../../pools/VecResultPool';
import {
  DotProduct,
  FlatVec,
  Normalize,
  VectorResultAllocator,
  VectorNegator,
  VectorSubtractor,
} from './vector';

const crp = new CollisionResultPool(1000);

const prp = new ProjectionResultPool(1000);

export function ZERO_CR_POOL() {
  crp.Zero();
}

export function ZERO_PR_POOL() {
  prp.Zero();
}

export function IntersectsPolygons(
  verticiesA: Array<FlatVec>,
  verticiesB: Array<FlatVec>
): ICollisionResult {
  let normal = VectorResultAllocator();
  let depth = Number.MAX_SAFE_INTEGER;

  const varDto = VectorResultAllocator(0, 0);
  const vbrDto = VectorResultAllocator(0, 0);

  for (let i = 0; i < verticiesA.length; i++) {
    // Go through verticies in clockwise order.
    const va = verticiesA[i];
    const vb = verticiesA[(i + 1) % verticiesA.length];
    varDto._setXY(va.x, va.y);
    vbrDto._setXY(vb.x, vb.y);
    const edge = VectorSubtractor(vbrDto, varDto); // get the edge
    let axis = VectorResultAllocator(-edge.Y, edge.X); // get the axis
    axis = Normalize(axis);
    // Project verticies for both polygons.
    const vaProj = ProjectVerticies(verticiesA, axis);
    const vbProj = ProjectVerticies(verticiesB, axis);

    if (vaProj.min >= vbProj.max || vbProj.min >= vaProj.max) {
      //return { collision: false, normal: null, depth: null } as collisionResult;
      const res = crp.Rent();
      res._setCollisionFalse();
      return res;
    }

    const axisDepth = Math.min(
      vbProj.max - vaProj.min,
      vaProj.max - vbProj.min
    );

    if (axisDepth < depth) {
      depth = axisDepth;
      normal = axis;
    }
  }

  varDto._setXY(0, 0);
  vbrDto._setXY(0, 0);

  for (let i = 0; i < verticiesB.length; i++) {
    const va = verticiesB[i];
    const vb = verticiesB[(i + 1) % verticiesB.length]; // Go through verticies in clockwise order.
    varDto._setXY(va.x, va.y);
    vbrDto._setXY(vb.x, vb.y);
    const edge = VectorSubtractor(vbrDto, varDto); // get the edge
    let axis = VectorResultAllocator(-edge.Y, edge.X); // get the axis
    axis = Normalize(axis);

    // Project verticies for both polygons.
    const vaProj = ProjectVerticies(verticiesA, axis);
    const vbProj = ProjectVerticies(verticiesB, axis);

    if (vaProj.min >= vbProj.max || vbProj.min >= vaProj.max) {
      const res = crp.Rent();
      res._setCollisionFalse();
      return res;
      //return { collision: false, normal: null, depth: null } as collisionResult;
    }
    const axisDepth = Math.min(
      vbProj.max - vaProj.min,
      vaProj.max - vbProj.min
    );
    if (axisDepth < depth) {
      depth = axisDepth;
      normal = axis;
    }
  }

  const centerA = FindArithemticMean(verticiesA);
  const centerB = FindArithemticMean(verticiesB);

  const direction = VectorSubtractor(centerB, centerA);

  if (DotProduct(direction, normal) < 0) {
    normal = VectorNegator(normal);
  }

  const res = crp.Rent();
  res._setCollisionTrue(normal.X, normal.Y, depth);
  return res;
  //return { collision: true, normal, depth } as collisionResult;
}

// suplimental functions ====================================

function FindArithemticMean(verticies: Array<FlatVec>): IVecResult {
  let sumX = 0;
  let sumY = 0;

  for (let index = 0; index < verticies.length; index++) {
    const v = verticies[index];
    sumX += v.x;
    sumY += v.y;
  }

  return VectorResultAllocator(
    sumX / verticies.length,
    sumY / verticies.length
  );
}

function ProjectVerticies(
  verticies: Array<FlatVec>,
  axis: IVecResult
): IProjectionResult {
  let min = Number.MAX_SAFE_INTEGER;
  let max = Number.MIN_SAFE_INTEGER;

  const vRes = VectorResultAllocator(0, 0);

  for (let i = 0; i < verticies.length; i++) {
    const v = verticies[i];
    vRes._setXY(v.x, v.y);
    const projection = DotProduct(vRes, axis); // get the projection for the given axis

    // set the minimum projection
    if (projection < min) {
      min = projection;
    }
    //set the maximum projection
    if (projection > max) {
      max = projection;
    }
  }

  let result = prp.Rent();
  result._setMinMax(min, max);
  return result;
}
