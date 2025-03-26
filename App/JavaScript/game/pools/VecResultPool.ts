import { FlatVec } from '../engine/physics/vector';

export class VecPool implements IPool<IPooledVector> {
  private pool: Array<PooledVector>;
  private poolIndex: number = 0;

  constructor(poolSize: number) {
    this.pool = new Array(poolSize);

    for (let i = 0; i < poolSize; i++) {
      this.pool[i] = new PooledVector();
    }
  }

  Rent(): PooledVector {
    let pi = this.poolIndex;
    let p = this.pool;
    let pLength = p.length;

    if (pi < pLength) {
      let vrd = p[pi];
      vrd._zero();
      this.poolIndex++;
      return vrd;
    }

    return new PooledVector();
  }

  Zero(): void {
    this.poolIndex = 0;
  }
  get ActiveCount(): number {
    return this.poolIndex;
  }
}

export interface IPooledVector {
  Add(vec: IPooledVector): IPooledVector;
  Subtract(vec: IPooledVector): IPooledVector;
  Multiply(s: number): IPooledVector;
  Negate(): IPooledVector;
  Divide(s: number): IPooledVector;
  Length(): number;
  Distance(vec: IPooledVector): number;
  Normalize(): IPooledVector;
  DotProduct(vec: IPooledVector): number;
  CrossProduct(vec: IPooledVector): number;
  SetFromFlatVec(vec: FlatVec): IPooledVector;
  get X(): number;
  get Y(): number;
  AddToX(x: number): void;
  AddToY(y: number): void;
  _setX(x: number): IPooledVector;
  _setY(y: number): IPooledVector;
  _setXY(x: number, y: number): IPooledVector;
  _zero(): void;
}

class PooledVector implements IPooledVector {
  private _x: number;
  private _y: number;

  constructor(x: number = 0, y: number = 0) {
    this._x = x;
    this._y = y;
  }

  public Add(vec: IPooledVector): IPooledVector {
    this._x += vec.X;
    this._y += vec.Y;
    return this;
  }

  public Subtract(vec: IPooledVector): IPooledVector {
    this._x -= vec.X;
    this._y -= vec.Y;
    return this;
  }

  public Multiply(s: number): IPooledVector {
    this._x *= s;
    this._y *= s;
    return this;
  }

  public Negate(): IPooledVector {
    this._x = -this._x;
    this._y = -this._y;
    return this;
  }

  public Divide(s: number): IPooledVector {
    this._x /= s;
    this._y /= s;
    return this;
  }

  public Length(): number {
    return Math.sqrt(this._x * this._x + this._y * this._y);
  }

  public Distance(vec: IPooledVector): number {
    const dx = this._x - vec.X;
    const dy = this._y - vec.Y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public Normalize(): IPooledVector {
    const length = Math.sqrt(this._x * this._x + this._y * this._y);
    this._x /= length;
    this._y /= length;
    return this;
  }

  public DotProduct(vec: IPooledVector): number {
    return this._x * vec.X + this._y * vec.Y;
  }

  public CrossProduct(vec: IPooledVector) {
    return this._x * vec.Y - this._y * vec.X;
  }

  public SetFromFlatVec(vec: FlatVec): IPooledVector {
    this._x = vec.x;
    this._y = vec.y;
    return this;
  }

  public AddToX(x: number): void {
    this._x += x;
  }

  public AddToY(y: number): void {
    this._y += y;
  }

  get X(): number {
    return this._x;
  }

  get Y(): number {
    return this._y;
  }

  public _setX(x: number): IPooledVector {
    this._x = x;
    return this;
  }

  public _setY(y: number): IPooledVector {
    this._y = y;
    return this;
  }

  public _setXY(x: number, y: number): IPooledVector {
    this._x = x;
    this._y = y;
    return this;
  }

  public _zero(): void {
    this._setXY(0, 0);
  }
}
