import { FlatVec } from '../engine/physics/vector';
import { Stage } from '../engine/stage/stageComponents';
import { FillArrayWithFlatVec } from '../engine/utils';

export class DebugRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private xRes: number;
  private yRes: number;

  constructor(canvas: HTMLCanvasElement, res: resolution) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.xRes = res.x;
    this.yRes = res.y;
    this.canvas.width = this.xRes;
    this.canvas.height = this.yRes;
  }

  render(renderDataDTO: RenderData) {
    const ctx = this.ctx;
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, this.xRes, this.yRes); // Fill the entire canvas with grey

    //ctx.fillStyle = 'white';
    drawStage(ctx, renderDataDTO);
    const playerCount = renderDataDTO.players.length;

    for (let i = 0; i < playerCount; i++) {
      drawPlayer(ctx, renderDataDTO.players[i]);
    }
    ctx.fillStyle = 'darkblue';

    ctx.fillText(`Frame: ${renderDataDTO.frame}`, 10, 30);
    ctx.fillText(`FrameTime: ${renderDataDTO.frameTime}`, 10, 60);
    ctx.fillText(
      `PlayerState: ${renderDataDTO.players[0].playerState}`,
      10,
      90
    );
    ctx.fillText(
      `PlayerState: ${renderDataDTO.players[0].facingRight}`,
      10,
      120
    );
    ctx.fillText(`VectorsRented: ${renderDataDTO.PooledVectors}`, 10, 150);
    ctx.fillText(
      `CollisionResultsRented: ${renderDataDTO.PooledCollisionResults}`,
      10,
      180
    );
    ctx.fillText(
      `ProjectionReultsRented: ${renderDataDTO.PooledProjectionResults}`,
      10,
      210
    );
  }
}

export type resolution = {
  x: number;
  y: number;
};

export class RenderData {
  frame: number = 0;
  frameTime: number = 0;
  players: Array<PlayerRenderData> = [];
  stage?: Stage;
  PooledVectors: number = 0;
  PooledCollisionResults: number = 0;
  PooledProjectionResults: number = 0;

  constructor(playerCount: number) {
    for (let i = 0; i < playerCount; i++) {
      this.players[i] = new PlayerRenderData();
    }
  }
}

class StageRenderData {
  stage: FlatVec[] = [];
  leftLegd: FlatVec[] = [];
  rightLegd: FlatVec[] = [];
}

class PlayerRenderData {
  playerState: string = 'IDLE';
  postionx: number = 0;
  postiony: number = 0;
  facingRight = true;
  currentLeftX: number = 0;
  currenltLeftY: number = 0;
  currentRightX: number = 0;
  currentRightY: number = 0;
  currentTopX: number = 0;
  currentTopY: number = 0;
  currentBottomX: number = 0;
  currentBottomY: number = 0;
  prevLeftX: number = 0;
  prevLeftY: number = 0;
  prevRightX: number = 0;
  prevRightY: number = 0;
  prevTopX: number = 0;
  prevTopY: number = 0;
  prevBottomX: number = 0;
  prevBottomY: number = 0;
  leftLedgeDetector: FlatVec[] = new Array<FlatVec>(4);
  rightLedgeDetector: FlatVec[] = new Array<FlatVec>(4);
  hull: FlatVec[] = [];

  constructor() {
    FillArrayWithFlatVec(this.leftLedgeDetector);
    FillArrayWithFlatVec(this.rightLedgeDetector);
  }
}

function drawStage(ctx: CanvasRenderingContext2D, renderData: RenderData) {
  if (renderData.stage === undefined) {
    return;
  }

  const stageVerts = renderData.stage.StageVerticies.GetVerts();
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

  const lLedge = renderData.stage.Ledges.GetLeftLedge();
  const rLedge = renderData.stage.Ledges.GetRightLedge();

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
  renderData: PlayerRenderData
) {
  const player = renderData;
  const playerPosX = player.postionx;
  const playerPosY = player.postiony;
  const ccHull = player.hull;
  const facingRight = player.facingRight;

  const ecbColor = 'orange';

  ctx.fillStyle = 'red';
  ctx.lineWidth = 3;

  //drawHull(ctx, player);
  drawPrevEcb(ctx, player);
  drawCurrentECB(ctx, player);
  drawPositionMarker(ctx, player);

  // draw direction marker
  ctx.strokeStyle = 'white';
  if (facingRight) {
    ctx.beginPath();
    ctx.moveTo(player.currentRightX, player.currentRightY);
    ctx.lineTo(player.currentRightX + 10, player.currentRightY);
    ctx.stroke();
    ctx.closePath();
  } else {
    ctx.beginPath();
    ctx.moveTo(player.currentLeftX, player.currenltLeftY);
    ctx.lineTo(player.currentLeftX - 10, player.currenltLeftY);
    ctx.stroke();
    ctx.closePath();
  }

  const leftDetector = player.leftLedgeDetector;
  const rightDetector = player.rightLedgeDetector;

  // Draw left detector
  ctx.strokeStyle = 'blue';

  if (!facingRight) {
    ctx.strokeStyle = 'red';
  }

  ctx.beginPath();
  ctx.moveTo(leftDetector[0].X, leftDetector[0].Y);
  for (let index = 0; index < leftDetector.length; index++) {
    ctx.lineTo(leftDetector[index].X, leftDetector[index].Y);
  }
  ctx.closePath();
  ctx.stroke();

  // Draw right detector
  ctx.strokeStyle = 'red';

  if (!facingRight) {
    ctx.strokeStyle = 'blue';
  }

  ctx.beginPath();
  ctx.moveTo(rightDetector[0].X, rightDetector[0].Y);
  for (let index = 0; index < rightDetector.length; index++) {
    ctx.lineTo(rightDetector[index].X, rightDetector[index].Y);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawPrevEcb(ctx: CanvasRenderingContext2D, player: PlayerRenderData) {
  const ecbColor = 'orange';

  ctx.fillStyle = 'red';
  ctx.lineWidth = 3;

  // draw previous ECB
  ctx.strokeStyle = 'black';
  ctx.beginPath();
  ctx.moveTo(player.prevLeftX, player.prevLeftY);
  ctx.lineTo(player.prevTopX, player.prevTopY);
  ctx.lineTo(player.prevRightX, player.prevRightY);
  ctx.lineTo(player.prevBottomX, player.prevBottomY);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
}

function drawHull(ctx: CanvasRenderingContext2D, player: PlayerRenderData) {
  const ccHull = player.hull;
  //draw hull
  ctx.beginPath();
  ctx.moveTo(ccHull[0].X, ccHull[0].Y);
  for (let i = 0; i < ccHull.length; i++) {
    ctx.lineTo(ccHull[i].X, ccHull[i].Y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawCurrentECB(
  ctx: CanvasRenderingContext2D,
  player: PlayerRenderData
) {
  ctx.fillStyle = 'orange';
  ctx.strokeStyle = 'purple';
  ctx.beginPath();
  ctx.moveTo(player.currentLeftX, player.currenltLeftY);
  ctx.lineTo(player.currentTopX, player.currentTopY);
  ctx.lineTo(player.currentRightX, player.currentRightY);
  ctx.lineTo(player.currentBottomX, player.currentBottomY);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
}

function drawPositionMarker(
  ctx: CanvasRenderingContext2D,
  player: PlayerRenderData
) {
  const playerPosX = player.postionx;
  const playerPosY = player.postiony;

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
