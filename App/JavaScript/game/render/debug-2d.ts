import { FlatVec } from '../engine/physics/vector';
import {
  ComponentHistory,
  ECBSnapShot,
  HurtCirclesSnapShot,
} from '../engine/player/playerComponents';
import { World } from '../engine/world/world';

export class DebugRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private xRes: number;
  private yRes: number;

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

  render(world: World, alpha: number) {
    let localFrame = world.localFrame;

    if (localFrame == 0) {
      return;
    }

    localFrame--;
    const ctx = this.ctx;
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, this.xRes, this.yRes); // Fill the entire canvas with grey

    drawStage(ctx, world);
    drawPlayer(ctx, world);

    const frameTime = world.GetFrameTimeForFrame(localFrame);

    ctx.fillStyle = 'darkblue';

    ctx.fillText(`Frame: ${localFrame}`, 10, 30);
    ctx.fillText(`FrameTime: ${frameTime}`, 10, 60);
    // ctx.fillText(
    //   `PlayerState: ${renderDataDTO.players[0].playerState}`,
    //   10,
    //   90
    // );
    // ctx.fillText(
    //   `PlayerState: ${renderDataDTO.players[0].facingRight}`,
    //   10,
    //   120
    // );
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

function drawPlayer(ctx: CanvasRenderingContext2D, world: World) {
  const playerCount = world.PlayerCount;
  const currentFrame = world.localFrame - 1;
  for (let i = 0; i < playerCount; i++) {
    const playerHistory = world.GetComponentHistory(i);
    const pos = playerHistory!.PositionHistory[currentFrame];
    const circleHistory = playerHistory!.HurtCirclesHistory[currentFrame];
    const flags = playerHistory!.FlagsHistory[currentFrame];
    const ecb = playerHistory!.EcbHistory[currentFrame];
    const lD = playerHistory!.LedgeDetectorHistory[currentFrame];
    const facingRight = flags.FacingRight;

    //drawHull(ctx, player);
    drawPrevEcb(ctx, ecb);
    drawCurrentECB(ctx, ecb);
    drawHurtCircles(ctx, circleHistory);
    drawPositionMarker(ctx, pos);

    // draw direction marker
    ctx.strokeStyle = 'white';
    if (facingRight) {
      const rightX = ComponentHistory.GetRightXFromEcbHistory(ecb);
      const rightY = ComponentHistory.GetRightYFromEcbHistory(ecb);
      ctx.beginPath();
      ctx.moveTo(rightX, rightY);
      ctx.lineTo(rightX + 10, rightY);
      ctx.stroke();
      ctx.closePath();
    } else {
      const leftX = ComponentHistory.GetLeftXFromEcbHistory(ecb);
      const leftY = ComponentHistory.GetLeftYFromEcbHistory(ecb);
      ctx.beginPath();
      ctx.moveTo(leftX, leftY);
      ctx.lineTo(leftX - 10, leftY);
      ctx.stroke();
      ctx.closePath();
    }

    const ldHeight = playerHistory!.StaticPlayerHistory.ledgDetecorHeight;
    const ldWidth = playerHistory!.StaticPlayerHistory.LedgeDetectorWidth;
    const middleTopX = lD.middleX;
    const middleTopY = lD.middleY;
    const TopRightX = lD.middleX + ldWidth;
    const TopRightY = lD.middleY;
    const BottomRightX = lD.middleX + ldWidth;
    const BottomRightY = lD.middleY + ldHeight;
    const middleBottomx = lD.middleX;
    const middleBottomY = lD.middleY + ldHeight;
    const topLeftX = lD.middleX - ldWidth;
    const topLeftY = lD.middleY;
    const bottomLeftX = lD.middleX - ldWidth;
    const bottomLeftY = lD.middleY + ldHeight;

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
  //const player = renderData;
}

function drawPrevEcb(ctx: CanvasRenderingContext2D, ecb: ECBSnapShot) {
  ctx.fillStyle = 'red';
  ctx.lineWidth = 3;

  const leftX = ComponentHistory.GetPrevLeftXFromEcbHistory(ecb);
  const leftY = ComponentHistory.GetPrevLeftYFromEcbHistory(ecb);
  const topX = ComponentHistory.GetPrevTopXFromEcbHistory(ecb);
  const topY = ComponentHistory.GetPrevTopYFromEcbHistory(ecb);
  const rightX = ComponentHistory.GetPrevRightXFromEcbHistory(ecb);
  const rightY = ComponentHistory.GetPrevRightYFromEcbHistory(ecb);
  const bottomX = ComponentHistory.GetPrevBottomXFromEcbHistory(ecb);
  const bottomY = ComponentHistory.GetPrevBottomYFromEcbHistory(ecb);

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

function drawCurrentECB(ctx: CanvasRenderingContext2D, ecb: ECBSnapShot) {
  const leftX = ComponentHistory.GetLeftXFromEcbHistory(ecb);
  const leftY = ComponentHistory.GetLeftYFromEcbHistory(ecb);
  const topX = ComponentHistory.GetTopXFromEcbHistory(ecb);
  const topY = ComponentHistory.GetTopYFromEcbHistory(ecb);
  const rightX = ComponentHistory.GetRightXFromEcbHistory(ecb);
  const rightY = ComponentHistory.GetRightYFromEcbHistory(ecb);
  const bottomX = ComponentHistory.GetBottomXFromEcbHistory(ecb);
  const bottomY = ComponentHistory.GetBottomYFromEcbHistory(ecb);

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
  hurtCircles: HurtCirclesSnapShot
) {
  const circles = hurtCircles.circls;
  const circlesLength = circles.length;

  ctx.strokeStyle = 'yellow'; // Set the stroke color for the circles
  ctx.fillStyle = 'yellow'; // Set the fill color for the circles
  ctx.lineWidth = 2; // Set the line width
  ctx.globalAlpha = 0.5; // Set transparency (50%)

  for (let i = 0; i < circlesLength; i++) {
    const circle = circles[i];
    ctx.beginPath();
    ctx.arc(circle.X, circle.Y, circle.Radius, 0, Math.PI * 2); // Draw the circle
    ctx.fill(); // Fill the circle with yellow
    ctx.stroke(); // Draw the circle outline
    ctx.closePath();
  }

  ctx.globalAlpha = 1.0; // Reset transparency to fully opaque
}

function drawPositionMarker(
  ctx: CanvasRenderingContext2D,
  posHistory: FlatVec
) {
  const playerPosX = posHistory.X;
  const playerPosY = posHistory.Y;

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
