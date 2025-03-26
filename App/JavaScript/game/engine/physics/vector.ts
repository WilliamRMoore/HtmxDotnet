import { IPooledVector, VecPool } from '../../pools/VecResultPool';

//let vrp = new VecResultPool(1000);

export class FlatVec {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

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
  y4: number,
  vecPool: VecPool
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
      vecPool.Rent()._setXY(x1 + uA * (x2 - x1), y1 + uA * (y2 - y1))
    );
  }

  return LineSegmentIntersectionResult.False();
}

class LineSegmentIntersectionResult {
  private Success: boolean;
  private VecResult: IPooledVector | undefined;

  private constructor(
    flag: boolean,
    vecRes: IPooledVector | undefined = undefined
  ) {
    this.Success = flag;
    this.VecResult = vecRes;
  }

  static True(vecRes: IPooledVector): LineSegmentIntersectionResult {
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

const srt = (a: FlatVec, b: FlatVec) => (a.x === b.x ? a.y - b.y : a.x - b.x);

const lower: Array<FlatVec> = [];
const upper: Array<FlatVec> = [];
const returnHull: Array<FlatVec> = [];
// Function to create a convex hull using Andrew's monotone chain algorithm
export function createConvexHull(points: Array<FlatVec>): Array<FlatVec> {
  while (returnHull.length > 0) {
    returnHull.pop();
  }

  // Sort points lexicographically
  points.sort(srt);

  const pointsLength = points.length;

  for (let i = 0; i < pointsLength - 1; i++) {
    const p = points[i];
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  for (let i = pointsLength - 1; i >= 0; i--) {
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
