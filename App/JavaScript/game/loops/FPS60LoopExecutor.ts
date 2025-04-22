const FPS = 60; // Target simulation FPS
const SIMULATION_INTERVAL = 1000 / FPS; // Time per simulation tick (in ms)

let previousTime = performance.now();
let accumulator = 0;

export function RENDERFPS60Loop(
  renderFunc: (alpha: number) => void // Render function with interpolation
) {
  const currentTime = performance.now();
  const deltaTime = currentTime - previousTime;
  previousTime = currentTime;

  // Accumulate time for interpolation
  accumulator += deltaTime;

  // Calculate the interpolation factor (alpha)
  const alpha = Math.min(accumulator / SIMULATION_INTERVAL, 1);

  // Render the frame with interpolation
  renderFunc(alpha);

  // Request the next frame
  window.requestAnimationFrame(() => RENDERFPS60Loop(renderFunc));
}

class AnimationFrame60FPSExecutor {
  fps: number = 60;
  now = {} as number;
  then = Date.now();
  interval = 1000 / this.fps;
  delta = {} as number;
}
