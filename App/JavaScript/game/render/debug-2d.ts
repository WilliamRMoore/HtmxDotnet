import { FlatVec } from '../engine/physics/vector';
import {
  ComponentHistory,
  ECBSnapShot,
  HurtCirclesSnapShot,
  LedgeDetectorSnapShot,
  StaticHistory,
} from '../engine/player/playerComponents';
import { Lerp } from '../engine/utils';
import { World } from '../engine/world/world';

function getAlpha(
  timeStampNow: number,
  lastFrame: number,
  localFrame: number,
  previousFrameTimeStamp: number,
  currentFrameTimeStamp: number
): number {
  const preClampAlpha =
    (timeStampNow - previousFrameTimeStamp) /
    (currentFrameTimeStamp - previousFrameTimeStamp);
  const postClampalpha = Math.max(0, Math.min(1, preClampAlpha));

  let alpha = preClampAlpha - postClampalpha;

  if (localFrame == lastFrame || alpha > 1) {
    alpha = 1;
  }

  return alpha;
}

export class DebugRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private xRes: number;
  private yRes: number;
  private lastFrame: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    res: resolution,
    numberOfPlayers: number = 1
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.xRes = res.x;
    this.yRes = res.y;
    this.canvas.width = this.xRes;
    this.canvas.height = this.yRes;
  }

  render(world: World, timeStampNow: number) {
    const localFrame = world.localFrame - 1 < 0 ? 0 : world.localFrame - 1; // world frame is incremented at the end of the loop, so we actually need to get the previous frame, as that is the frame with the most current render artifact.
    const previousFrameTimeStamp = world.GetFrameTimeStampForFrame(
      localFrame == 0 ? 0 : localFrame - 1
    );
    const currentFrameTimeStamp = world.GetFrameTimeStampForFrame(localFrame);

    const alpha = getAlpha(
      timeStampNow,
      this.lastFrame,
      localFrame,
      previousFrameTimeStamp,
      currentFrameTimeStamp
    );

    const playerStateHistory = world.GetComponentHistory(0); // hard coded to player 1 right now
    const playerFacingRight =
      playerStateHistory?.FlagsHistory[localFrame]?.FacingRight ?? true;
    const playerFsmState =
      playerStateHistory?.FsmInfoHistory[localFrame]?.State?.StateName ?? 'N/A';

    if (localFrame == 0) {
      return;
    }

    const ctx = this.ctx;
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, this.xRes, this.yRes); // Fill the entire canvas with grey

    drawStage(ctx, world);
    drawPlayer(ctx, world, alpha);

    const frameTime = world.GetFrameTimeForFrame(localFrame);

    ctx.fillStyle = 'darkblue';

    ctx.fillText(`Frame: ${localFrame}`, 10, 30);
    ctx.fillText(`FrameTime: ${frameTime}`, 10, 60);
    ctx.fillText(`PlayerState: ${playerFsmState}`, 10, 90);
    ctx.fillText(`Facing Right: ${playerFacingRight}`, 10, 120);
    ctx.fillText(
      `VectorsRented: ${world.GetRentedVecsForFrame(localFrame)}`,
      10,
      150
    );
    ctx.fillText(
      `CollisionResultsRented: ${world.GetRentedColResForFrame(localFrame)}`,
      10,
      180
    );
    ctx.fillText(
      `ProjectionReultsRented: ${world.GetRentedProjResForFrame(localFrame)}`,
      10,
      210
    );

    this.lastFrame = localFrame;
  }
}

export type resolution = {
  x: number;
  y: number;
};

function drawStage(ctx: CanvasRenderingContext2D, world: World) {
  const stage = world.Stage;
  const stageVerts = stage!.StageVerticies.GetVerts()!;
  const color = 'green';
  const stageVertsLength = stageVerts.length;

  ctx.beginPath();
  ctx.moveTo(stageVerts[0].X, stageVerts[0].Y);
  for (let i = 0; i < stageVertsLength; i++) {
    ctx.lineTo(stageVerts[i].X, stageVerts[i].Y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  const lLedge = stage!.Ledges.GetLeftLedge();
  const rLedge = stage!.Ledges.GetRightLedge();

  ctx.fillStyle = 'yellow';
  ctx.beginPath();
  ctx.moveTo(lLedge[0].X, lLedge[0].Y);
  for (let i = 0; i < lLedge.length; i++) {
    ctx.lineTo(lLedge[i].X, lLedge[i].Y);
  }
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(rLedge[0].X, rLedge[0].Y);
  for (let i = 0; i < rLedge.length; i++) {
    ctx.lineTo(rLedge[i].X, rLedge[i].Y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  world: World,
  alpha: number
) {
  const playerCount = world.PlayerCount;
  const currentFrame = world.localFrame - 1;
  const lastFrame = currentFrame < 1 ? 0 : currentFrame - 1;
  for (let i = 0; i < playerCount; i++) {
    const playerHistory = world.GetComponentHistory(i);
    const pos = playerHistory!.PositionHistory[currentFrame];
    const lastPos = playerHistory!.PositionHistory[lastFrame];
    const circles = playerHistory!.HurtCirclesHistory[currentFrame];
    const lastCirclse = playerHistory!.HurtCirclesHistory[lastFrame];
    const flags = playerHistory!.FlagsHistory[currentFrame];
    const lastFlags = playerHistory!.FlagsHistory[lastFrame];
    const ecb = playerHistory!.EcbHistory[currentFrame];
    const lastEcb = playerHistory!.EcbHistory[lastFrame];
    const lD = playerHistory!.LedgeDetectorHistory[currentFrame];
    const lastLd = playerHistory!.LedgeDetectorHistory[lastFrame];
    const facingRight = flags.FacingRight;
    const lastFacingRight = lastFlags?.FacingRight;

    //drawHull(ctx, player);
    drawPrevEcb(ctx, ecb, lastEcb, alpha);
    drawCurrentECB(ctx, ecb, lastEcb, alpha);
    drawHurtCircles(ctx, circles, lastCirclse, alpha);
    drawPositionMarker(ctx, pos, lastPos, alpha);
    const lerpDirection = alpha > 0.5 ? facingRight : lastFacingRight;
    drawDirectionMarker(ctx, lerpDirection, ecb, lastEcb, alpha);
    drawLedgeDetectors(
      ctx,
      facingRight,
      playerHistory!.StaticPlayerHistory,
      lD,
      lastLd,
      alpha
    );
  }
}

function drawLedgeDetectors(
  ctx: CanvasRenderingContext2D,
  facingRight: boolean,
  staticHistory: StaticHistory,
  ledgeDetectorHistory: LedgeDetectorSnapShot,
  lastLedgeDetectorHistory: LedgeDetectorSnapShot,
  alpha: number
) {
  const ldHeight = staticHistory.ledgDetecorHeight;
  const ldWidth = staticHistory.LedgeDetectorWidth;
  const curMiddleTopX = ledgeDetectorHistory.middleX;
  const curMiddleTopY = ledgeDetectorHistory.middleY;
  const curTopRightX = ledgeDetectorHistory.middleX + ldWidth;
  const curTopRightY = ledgeDetectorHistory.middleY;
  const curBottomRightX = ledgeDetectorHistory.middleX + ldWidth;
  const curBottomRightY = ledgeDetectorHistory.middleY + ldHeight;
  const curMiddleBottomx = ledgeDetectorHistory.middleX;
  const curMiddleBottomY = ledgeDetectorHistory.middleY + ldHeight;
  const curTopLeftX = ledgeDetectorHistory.middleX - ldWidth;
  const curTopLeftY = ledgeDetectorHistory.middleY;
  const curBottomLeftX = ledgeDetectorHistory.middleX - ldWidth;
  const curBottomLeftY = ledgeDetectorHistory.middleY + ldHeight;

  const lastMiddleTopX = lastLedgeDetectorHistory.middleX;
  const lastMiddleTopY = lastLedgeDetectorHistory.middleY;
  const lastTopRightX = lastLedgeDetectorHistory.middleX + ldWidth;
  const lastTopRightY = lastLedgeDetectorHistory.middleY;
  const lastBottomRightX = lastLedgeDetectorHistory.middleX + ldWidth;
  const lastBottomRightY = lastLedgeDetectorHistory.middleY + ldHeight;
  const lastMiddleBottomx = lastLedgeDetectorHistory.middleX;
  const lastMiddleBottomY = lastLedgeDetectorHistory.middleY + ldHeight;
  const lastTopLeftX = lastLedgeDetectorHistory.middleX - ldWidth;
  const lastTopLeftY = lastLedgeDetectorHistory.middleY;
  const lastBottomLeftX = lastLedgeDetectorHistory.middleX - ldWidth;
  const lastBottomLeftY = lastLedgeDetectorHistory.middleY + ldHeight;

  const middleTopX = Lerp(lastMiddleTopX, curMiddleTopX, alpha);
  const middleTopY = Lerp(lastMiddleTopY, curMiddleTopY, alpha);
  const TopRightX = Lerp(lastTopRightX, curTopRightX, alpha);
  const TopRightY = Lerp(lastTopRightY, curTopRightY, alpha);
  const BottomRightX = Lerp(lastBottomRightX, curBottomRightX, alpha);
  const BottomRightY = Lerp(lastBottomRightY, curBottomRightY, alpha);
  const middleBottomx = Lerp(lastMiddleBottomx, curMiddleBottomx, alpha);
  const middleBottomY = Lerp(lastMiddleBottomY, curMiddleBottomY, alpha);
  const topLeftX = Lerp(lastTopLeftX, curTopLeftX, alpha);
  const topLeftY = Lerp(lastTopLeftY, curTopLeftY, alpha);
  const bottomLeftX = Lerp(lastBottomLeftX, curBottomLeftX, alpha);
  const bottomLeftY = Lerp(lastBottomLeftY, curBottomLeftY, alpha);

  // Draw right detector
  ctx.strokeStyle = 'blue';

  if (!facingRight) {
    ctx.strokeStyle = 'red';
  }

  ctx.beginPath();
  ctx.moveTo(middleTopX, middleTopY);
  ctx.lineTo(TopRightX, TopRightY);
  ctx.lineTo(BottomRightX, BottomRightY);
  ctx.lineTo(middleBottomx, middleBottomY);
  ctx.closePath();
  ctx.stroke();

  // Draw left detector
  ctx.strokeStyle = 'red';

  if (!facingRight) {
    ctx.strokeStyle = 'blue';
  }

  ctx.beginPath();
  ctx.moveTo(topLeftX, topLeftY);
  ctx.lineTo(middleTopX, middleTopY);
  ctx.lineTo(middleBottomx, middleBottomY);
  ctx.lineTo(bottomLeftX, bottomLeftY);
  ctx.closePath();
  ctx.stroke();
}

function drawDirectionMarker(
  ctx: CanvasRenderingContext2D,
  facingRight: boolean,
  ecb: ECBSnapShot,
  lastEcb: ECBSnapShot,
  alpha: number
) {
  ctx.strokeStyle = 'white';
  if (facingRight) {
    const curRightX = ComponentHistory.GetRightXFromEcbHistory(ecb);
    const curRightY = ComponentHistory.GetRightYFromEcbHistory(ecb);
    const lastRightX = ComponentHistory.GetRightXFromEcbHistory(lastEcb);
    const lastRightY = ComponentHistory.GetRightYFromEcbHistory(lastEcb);

    const rightX = Lerp(lastRightX, curRightX, alpha);
    const rightY = Lerp(lastRightY, curRightY, alpha);

    ctx.beginPath();
    ctx.moveTo(rightX, rightY);
    ctx.lineTo(rightX + 10, rightY);
    ctx.stroke();
    ctx.closePath();
  } else {
    const curLeftX = ComponentHistory.GetLeftXFromEcbHistory(ecb);
    const curLeftY = ComponentHistory.GetLeftYFromEcbHistory(ecb);
    const lastLeftX = ComponentHistory.GetLeftXFromEcbHistory(lastEcb);
    const lastLeftY = ComponentHistory.GetLeftYFromEcbHistory(lastEcb);

    const leftX = Lerp(lastLeftX, curLeftX, alpha);
    const leftY = Lerp(lastLeftY, curLeftY, alpha);

    ctx.beginPath();
    ctx.moveTo(leftX, leftY);
    ctx.lineTo(leftX - 10, leftY);
    ctx.stroke();
    ctx.closePath();
  }
}

function drawPrevEcb(
  ctx: CanvasRenderingContext2D,
  curEcb: ECBSnapShot,
  lastEcb: ECBSnapShot,
  alpha: number
) {
  ctx.fillStyle = 'red';
  ctx.lineWidth = 3;

  const curLeftX = ComponentHistory.GetPrevLeftXFromEcbHistory(curEcb);
  const curLeftY = ComponentHistory.GetPrevLeftYFromEcbHistory(curEcb);
  const curTopX = ComponentHistory.GetPrevTopXFromEcbHistory(curEcb);
  const curTopY = ComponentHistory.GetPrevTopYFromEcbHistory(curEcb);
  const curRightX = ComponentHistory.GetPrevRightXFromEcbHistory(curEcb);
  const curRightY = ComponentHistory.GetPrevRightYFromEcbHistory(curEcb);
  const curBottomX = ComponentHistory.GetPrevBottomXFromEcbHistory(curEcb);
  const curBottomY = ComponentHistory.GetPrevBottomYFromEcbHistory(curEcb);

  const lastLeftX = ComponentHistory.GetPrevLeftXFromEcbHistory(lastEcb);
  const lastLeftY = ComponentHistory.GetPrevLeftYFromEcbHistory(lastEcb);
  const lastTopX = ComponentHistory.GetPrevTopXFromEcbHistory(lastEcb);
  const lastTopY = ComponentHistory.GetPrevTopYFromEcbHistory(lastEcb);
  const lastRightX = ComponentHistory.GetPrevRightXFromEcbHistory(lastEcb);
  const lastRightY = ComponentHistory.GetPrevRightYFromEcbHistory(lastEcb);
  const LastBottomX = ComponentHistory.GetPrevBottomXFromEcbHistory(lastEcb);
  const LastBottomY = ComponentHistory.GetPrevBottomYFromEcbHistory(lastEcb);

  const leftX = Lerp(lastLeftX, curLeftX, alpha);
  const leftY = Lerp(lastLeftY, curLeftY, alpha);
  const topX = Lerp(lastTopX, curTopX, alpha);
  const topY = Lerp(lastTopY, curTopY, alpha);
  const rightX = Lerp(lastRightX, curRightX, alpha);
  const rightY = Lerp(lastRightY, curRightY, alpha);
  const bottomX = Lerp(LastBottomX, curBottomX, alpha);
  const bottomY = Lerp(LastBottomY, curBottomY, alpha);

  // draw previous ECB
  ctx.strokeStyle = 'black';
  ctx.beginPath();
  ctx.moveTo(leftX, leftY);
  ctx.lineTo(topX, topY);
  ctx.lineTo(rightX, rightY);
  ctx.lineTo(bottomX, bottomY);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
}

// function drawHull(ctx: CanvasRenderingContext2D, player: PlayerRenderData) {
//   const ccHull = player.hull;
//   //draw hull
//   ctx.beginPath();
//   ctx.moveTo(ccHull[0].X, ccHull[0].Y);
//   for (let i = 0; i < ccHull.length; i++) {
//     ctx.lineTo(ccHull[i].X, ccHull[i].Y);
//   }
//   ctx.closePath();
//   ctx.fill();
// }

function drawCurrentECB(
  ctx: CanvasRenderingContext2D,
  ecb: ECBSnapShot,
  lastEcb: ECBSnapShot,
  alpha: number
) {
  const curLeftX = ComponentHistory.GetLeftXFromEcbHistory(ecb);
  const curLeftY = ComponentHistory.GetLeftYFromEcbHistory(ecb);
  const curTopX = ComponentHistory.GetTopXFromEcbHistory(ecb);
  const curTopY = ComponentHistory.GetTopYFromEcbHistory(ecb);
  const curRightX = ComponentHistory.GetRightXFromEcbHistory(ecb);
  const curRightY = ComponentHistory.GetRightYFromEcbHistory(ecb);
  const curBottomX = ComponentHistory.GetBottomXFromEcbHistory(ecb);
  const curBottomY = ComponentHistory.GetBottomYFromEcbHistory(ecb);

  const lastLeftX = ComponentHistory.GetLeftXFromEcbHistory(lastEcb);
  const lastLeftY = ComponentHistory.GetLeftYFromEcbHistory(lastEcb);
  const lastTopX = ComponentHistory.GetTopXFromEcbHistory(lastEcb);
  const lastTopY = ComponentHistory.GetTopYFromEcbHistory(lastEcb);
  const lastRightX = ComponentHistory.GetRightXFromEcbHistory(lastEcb);
  const lastRightY = ComponentHistory.GetRightYFromEcbHistory(lastEcb);
  const lastBottomX = ComponentHistory.GetBottomXFromEcbHistory(lastEcb);
  const lastBottomY = ComponentHistory.GetBottomYFromEcbHistory(lastEcb);

  const leftX = Lerp(lastLeftX, curLeftX, alpha);
  const leftY = Lerp(lastLeftY, curLeftY, alpha);
  const topX = Lerp(lastTopX, curTopX, alpha);
  const topY = Lerp(lastTopY, curTopY, alpha);
  const rightX = Lerp(lastRightX, curRightX, alpha);
  const rightY = Lerp(lastRightY, curRightY, alpha);
  const bottomX = Lerp(lastBottomX, curBottomX, alpha);
  const bottomY = Lerp(lastBottomY, curBottomY, alpha);

  ctx.fillStyle = 'orange';
  ctx.strokeStyle = 'purple';
  ctx.beginPath();
  ctx.moveTo(leftX, leftY);
  ctx.lineTo(topX, topY);
  ctx.lineTo(rightX, rightY);
  ctx.lineTo(bottomX, bottomY);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
}

function drawHurtCircles(
  ctx: CanvasRenderingContext2D,
  hurtCircles: HurtCirclesSnapShot,
  lastHurtCircles: HurtCirclesSnapShot,
  alpha: number
) {
  const circles = hurtCircles.circls;
  const lastCircles = lastHurtCircles.circls;
  const circlesLength = circles.length;

  ctx.strokeStyle = 'yellow'; // Set the stroke color for the circles
  ctx.fillStyle = 'yellow'; // Set the fill color for the circles
  ctx.lineWidth = 2; // Set the line width
  ctx.globalAlpha = 0.5; // Set transparency (50%)

  for (let i = 0; i < circlesLength; i++) {
    const circle = circles[i];
    const lastHurtCircle = lastCircles[i];
    const x = Lerp(lastHurtCircle.X, circle.X, alpha);
    const y = Lerp(lastHurtCircle.Y, circle.Y, alpha);

    ctx.beginPath();
    ctx.arc(x, y, circle.Radius, 0, Math.PI * 2); // Draw the circle
    ctx.fill(); // Fill the circle with yellow
    ctx.stroke(); // Draw the circle outline
    ctx.closePath();
  }

  ctx.globalAlpha = 1.0; // Reset transparency to fully opaque
}

function drawPositionMarker(
  ctx: CanvasRenderingContext2D,
  posHistory: FlatVec,
  lastPosHistory: FlatVec,
  alpha: number
) {
  const playerPosX = Lerp(lastPosHistory.X, posHistory.X, alpha);
  const playerPosY = Lerp(lastPosHistory.Y, posHistory.Y, alpha);

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'blue';

  ctx.beginPath();
  ctx.moveTo(playerPosX, playerPosY);
  ctx.lineTo(playerPosX + 10, playerPosY);
  ctx.stroke();
  ctx.moveTo(playerPosX, playerPosY);
  ctx.lineTo(playerPosX - 10, playerPosY);
  ctx.stroke();
  ctx.moveTo(playerPosX, playerPosY);
  ctx.lineTo(playerPosX, playerPosY + 10);
  ctx.stroke();
  ctx.moveTo(playerPosX, playerPosY);
  ctx.lineTo(playerPosX, playerPosY - 10);
  ctx.stroke();
  ctx.closePath();
}
