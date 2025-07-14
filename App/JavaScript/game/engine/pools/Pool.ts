export interface IPooledObject {
  Zero(): void;
}

//TODO:  this is NOT jit friendly.
// Replace with one large pool class that contains concrete instances of the different pool types.
export class Pool<T extends IPooledObject> {
  private pool: Array<T>;
  private poolIndex: number = 0;
  private constructorFunc: () => T;

  constructor(poolSize: number, constructorFunc: () => T) {
    this.pool = new Array(poolSize);
    this.constructorFunc = constructorFunc;
    for (let i = 0; i < poolSize; i++) {
      this.pool[i] = constructorFunc();
    }
  }

  Rent(): T {
    let pi = this.poolIndex;
    let p = this.pool;
    let pLength = p.length;

    if (pi < pLength) {
      let item = p[pi];
      item.Zero();
      this.poolIndex++;
      return item;
    }

    return this.constructorFunc();
  }

  Zero(): void {
    this.poolIndex = 0;
  }

  get ActiveCount(): number {
    return this.poolIndex;
  }
}
