const FPS = 60; // 60; // 59.94 is the standard for film and video, but 60 is used in some games and applications
let now = {} as number;
let then = Date.now();
const interval = 1000 / FPS;
let delta = {} as number;

export function RENDERFPS60Loop(loopFunc: () => void) {
  window.requestAnimationFrame(() => RENDERFPS60Loop(loopFunc));
  now = Date.now();
  delta = now - then;
  if (delta > interval) {
    loopFunc();
  }
}

class AnimationFrame60FPSExecutor {
  fps: number = 60;
  now = {} as number;
  then = Date.now();
  interval = 1000 / this.fps;
  delta = {} as number;
}
