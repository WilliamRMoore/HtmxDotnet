import { CollisionResultPool } from './CollisionResultPool';

export class ProjectionResultPool implements IPool<ProjectionResult> {
  private pool: Array<ProjectionResult>;
  private poolIndex: number = 0;

  constructor(poolSize: number) {
    this.pool = new Array(poolSize);
    for (let i = 0; i < poolSize; i++) {
      this.pool[i] = new ProjectionResult();
    }
  }

  Rent(): ProjectionResult {
    let pi = this.poolIndex;
    let p = this.pool;
    let pLength = p.length;

    if (pi < pLength) {
      const result = p[pi];
      result._zero();
      this.poolIndex++;
      return result;
    }

    return new ProjectionResult();
  }

  Zero(): void {
    this.poolIndex = 0;
  }

  get ActiveCount(): number {
    return this.poolIndex;
  }
}

class ProjectionResult implements IProjectionResult {
  private _min: number;
  private _max: number;
  constructor(x: number = 0, y: number = 0) {
    this._min = x;
    this._max = y;
  }

  public get max(): number {
    return this._max;
  }

  public get min(): number {
    return this._min;
  }

  public _setMinMax(min: number, max: number): void {
    this._min = min;
    this._max = max;
  }

  public _zero() {
    this._min = 0;
    this._max = 0;
  }
}

export interface IProjectionResult {
  get max(): number;
  get min(): number;
  _setMinMax(x: number, y: number): void;
  _zero(): void;
}
