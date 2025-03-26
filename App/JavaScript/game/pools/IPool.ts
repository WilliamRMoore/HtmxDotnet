interface IPool<T> {
  Rent(): T;
  Zero(): void;
  get ActiveCount(): number;
}
