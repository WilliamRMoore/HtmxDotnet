import { IVecResult, VecResultPool } from '../../pools/VecResultPool';

let vrp = new VecResultPool(1000);

export class FlatVec {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export function SET_POOL(pool: VecResultPool) {
  vrp = pool;
}

export function ZERO_VR_POOL() {
  vrp.Zero();
}

export const VectorAdder = (v1: IVecResult, v2: IVecResult): IVecResult => {
  return VectorResultAllocator(v1.X + v2.X, v1.Y + v2.Y);
};

export const VectorSubtractor = (
  v1: IVecResult,
  v2: IVecResult
): IVecResult => {
  return VectorResultAllocator(v1.X - v2.X, v1.Y - v2.Y);
};

export const VectorMultiplier = (v: IVecResult, s: number): IVecResult => {
  return VectorResultAllocator(v.X * s, v.Y * s);
};

export const VectorNegator = (v: IVecResult): IVecResult => {
  return VectorResultAllocator(-v.X, -v.Y);
};

export const VectorDivider = (v: IVecResult, s: number): IVecResult => {
  return VectorResultAllocator(v.X / s, v.Y / s);
};

export const Length = (v: IVecResult): number => {
  return Math.sqrt(v.X * v.X + v.Y * v.Y);
};

export const Distance = (v1: IVecResult, v2: IVecResult): number => {
  const dx = v1.X - v2.X;
  const dy = v1.Y - v2.Y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const Normalize = (v: IVecResult): IVecResult => {
  const length = Length(v);
  return VectorResultAllocator(v.X / length, v.Y / length);
};

export const DotProduct = (v1: IVecResult, v2: IVecResult): number => {
  return v1.X * v2.X + v1.Y * v2.Y;
};

export const CrossProduct = (v1: IVecResult, v2: IVecResult): number => {
  return v1.X * v2.Y - v1.Y * v2.X;
};

export const VectorResultAllocator = (
  x: number = 0,
  y: number = 0
): IVecResult => {
  let VecResultDto = vrp.Rent();
  VecResultDto._setXY(x, y);
  return VecResultDto;
};

export const VectorToVectorResultAllocator = (fv: FlatVec) => {
  return VectorResultAllocator(fv.x, fv.y);
};

export function LineSegmentIntersection(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
): boolean {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  const numeA = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  const numeB = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);

  if (denom === 0) {
    return false;
  }

  const uA = numeA / denom;
  const uB = numeB / denom;

  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    return true;
  }

  return false;
}

function AlternateLineSegmentIntersection(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
): LineSegmentIntersectionResult {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  const numeA = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  const numeB = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);

  if (denom === 0) {
    return LineSegmentIntersectionResult.False();
  }

  const uA = numeA / denom;
  const uB = numeB / denom;

  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    //return true;
    return LineSegmentIntersectionResult.True(
      VectorResultAllocator(x1 + uA * (x2 - x1), y1 + uA * (y2 - y1))
    );
  }

  return LineSegmentIntersectionResult.False();
}

class LineSegmentIntersectionResult {
  private Success: boolean;
  private VecResult: IVecResult | undefined;

  private constructor(
    flag: boolean,
    vecRes: IVecResult | undefined = undefined
  ) {
    this.Success = flag;
    this.VecResult = vecRes;
  }

  static True(vecRes: IVecResult): LineSegmentIntersectionResult {
    return new LineSegmentIntersectionResult(true, vecRes);
  }

  static False(): LineSegmentIntersectionResult {
    return new LineSegmentIntersectionResult(false);
  }
}

// Function to compute the cross product of two vectors
function cross(o: FlatVec, a: FlatVec, b: FlatVec): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

const lower: Array<FlatVec> = [];
const upper: Array<FlatVec> = [];
const returnHull: Array<FlatVec> = [];
// Function to create a convex hull using Andrew's monotone chain algorithm
export function createConvexHull(points: Array<FlatVec>): Array<FlatVec> {
  // while (lower.length > 0) {
  //   lower.pop();
  // }
  // while (upper.length > 0) {
  //   upper.pop();
  // }
  while (returnHull.length > 0) {
    returnHull.pop();
  }
  // Sort points lexicographically
  points.sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  //const lower: Array<FlatVec> = [];
  for (const p of points) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  //const upper: Array<FlatVec> = [];
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  // Remove the last point of each half because it's repeated at the beginning of the other half
  upper.pop();
  lower.pop();

  // Concatenate lower and upper hull to get the full convex hull
  //return lower.concat(upper);
  while (lower.length > 0) {
    returnHull.push(lower.pop()!);
  }

  while (upper.length > 0) {
    returnHull.push(upper.pop()!);
  }

  return returnHull;
}
