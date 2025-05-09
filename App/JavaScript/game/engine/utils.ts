import { FlatVec } from './physics/vector';

export function FillArrayWithFlatVec(fvArr: FlatVec[]): void {
  for (let index = 0; index < fvArr.length; index++) {
    fvArr[index] = new FlatVec(0, 0);
  }
}

export function HashCode(obj: any): number {
  const j = JSON.stringify(obj);

  var hash = 0;
  for (var i = 0; i < j.length; i++) {
    var code = j.charCodeAt(i);
    hash = (hash << 5) - hash + code;
    hash = hash & hash;
  }
  return hash;
}

export function Clamp(val: number, clamp: number): number {
  return Math.min(Math.max(val, -clamp), clamp);
}

export function Lerp(start: number, end: number, alpha: number): number {
  return start + (end - start) * alpha;
}

export function EaseIn(t: number) {
  return t * t;
}

export function EaseInPower(t: number, p: number) {
  return Math.pow(t, p);
}
