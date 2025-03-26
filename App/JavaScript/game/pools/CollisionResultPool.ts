export class CollisionResultPool implements IPool<CollisionResult> {
  private pool: Array<CollisionResult>;
  private poolIndex: number = 0;

  constructor(poolSize: number) {
    this.pool = new Array(poolSize);

    for (let i = 0; i < poolSize; i++) {
      this.pool[i] = new CollisionResult();
    }
  }

  Rent(): CollisionResult {
    let pi = this.poolIndex;
    let p = this.pool;
    let pLength = p.length;

    if (pi < pLength) {
      const result = p[pi];
      result._setCollisionFalse();
      this.poolIndex++;
      return result;
    }

    return new CollisionResult();
  }

  Zero(): void {
    this.poolIndex = 0;
  }

  get ActiveCount(): number {
    return this.poolIndex;
  }
}

export interface ICollisionResult {
  _setCollisionTrue(x: number, y: number, depth: number): void;
  _setCollisionFalse(): void;
  get normX(): number;
  get normY(): number;
  get collision(): boolean;
  get depth(): number;
}

class CollisionResult implements ICollisionResult {
  private _collision: boolean = false;
  private _normX: number = 0;
  private _normY: number = 0;
  private _depth: number = 0;

  _setCollisionTrue(x: number, y: number, depth: number): void {
    this._collision = true;
    this._normX = x;
    this._normY = y;
    this._depth = depth;
  }

  _setCollisionFalse(): void {
    this._collision = false;
    this._normX = 0;
    this._normY = 0;
    this._depth = 0;
  }

  public get collision(): boolean {
    return this._collision;
  }

  public get depth(): number {
    return this._depth;
  }

  public get normX(): number {
    return this._normX;
  }

  public get normY(): number {
    return this._normY;
  }
}
