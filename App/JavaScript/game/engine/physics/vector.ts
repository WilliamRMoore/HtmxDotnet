import { Pool } from '../../pools/Pool';
import { IPooledVector, PooledVector } from '../../pools/PooledVector';

export class FlatVec {
  public X: number;
  public Y: number;

  constructor(x: number, y: number) {
    this.X = x;
    this.Y = y;
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
  vecPool: Pool<PooledVector>
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
      vecPool.Rent().SetXY(x1 + uA * (x2 - x1), y1 + uA * (y2 - y1))
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
  return (a.X - o.X) * (b.Y - o.Y) - (a.Y - o.Y) * (b.X - o.X);
}

// const srt = (a: FlatVec, b: FlatVec) => (a.X === b.X ? a.Y - b.Y : a.X - b.X);

// const lower: Array<FlatVec> = [];
// const upper: Array<FlatVec> = [];
// const returnHull: Array<FlatVec> = [];
// // Function to create a convex hull using Andrew's monotone chain algorithm
// export function createConvexHull(points: Array<FlatVec>): Array<FlatVec> {
//   //returnHull.length = 0;
//   while (returnHull.length > 0) {
//     returnHull.pop();
//   }

//   // Sort points lexicographically
//   points.sort(srt);

//   const pointsLength = points.length;

//   for (let i = 0; i < pointsLength - 1; i++) {
//     const p = points[i];
//     while (
//       lower.length >= 2 &&
//       cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
//     ) {
//       lower.pop();
//     }
//     lower.push(p);
//   }

//   for (let i = pointsLength - 1; i >= 0; i--) {
//     const p = points[i];
//     while (
//       upper.length >= 2 &&
//       cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
//     ) {
//       upper.pop();
//     }
//     upper.push(p);
//   }

//   // Remove the last point of each half because it's repeated at the beginning of the other half
//   upper.pop();
//   lower.pop();

//   // Concatenate lower and upper hull to get the full convex hull
//   //return lower.concat(upper);
//   while (lower.length > 0) {
//     returnHull.push(lower.pop()!);
//   }

//   while (upper.length > 0) {
//     returnHull.push(upper.pop()!);
//   }

//   return returnHull;
// }
// Function to create a convex hull using Andrew's monotone chain algorithm
// Reusable arrays for lower and upper hulls
const lower: Array<FlatVec> = [];
const upper: Array<FlatVec> = [];

export function createConvexHull(points: Array<FlatVec>): Array<FlatVec> {
  if (points.length < 3) {
    // A convex hull is not possible with fewer than 3 points
    lower.length = 0; // Clear the lower array
    for (let i = 0; i < points.length; i++) {
      lower.push(points[i]);
    }
    return lower;
  }

  // Sort points lexicographically (by X, then by Y)
  points.sort((a, b) => (a.X === b.X ? a.Y - b.Y : a.X - b.X));

  // Clear the lower and upper arrays
  lower.length = 0;
  upper.length = 0;

  // Build the lower hull
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  // Build the upper hull
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
  lower.pop();
  upper.pop();

  // Concatenate upper hull into the lower array
  for (let i = 0; i < upper.length; i++) {
    lower.push(upper[i]);
  }

  return lower;
}
