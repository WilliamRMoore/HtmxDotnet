import { FlatVec } from '../engine/physics/vector';
import { Stage } from '../engine/stage/stageComponents';

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
    drawPlayer(ctx, renderDataDTO);
    ctx.fillText(`Frame: ${renderDataDTO.frame}`, 10, 30);
    ctx.fillText(`FrameTime: ${renderDataDTO.frameTime}`, 10, 60);
    ctx.fillText(`PlayerState: ${renderDataDTO.player.playerState}`, 10, 90);
    ctx.fillText(`PlayerState: ${renderDataDTO.player.facingRight}`, 10, 120);
  }
}

export type resolution = {
  x: number;
  y: number;
};

export class RenderData {
  frame: number = 0;
  frameTime: number = 0;
  player: PlayerRenderData = new PlayerRenderData();
  stage?: Stage;
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
  // ccHull: FlatVec[] = new Array<FlatVec>(8);
}

function drawStage(ctx: CanvasRenderingContext2D, renderData: RenderData) {
  if (renderData.stage === undefined) {
    return;
  }

  const stageVerts = renderData.stage.StageVerticies.GetVerts();
  const color = 'green';
  const stageVertsLength = stageVerts.length;

  ctx.beginPath();
  ctx.moveTo(stageVerts[0].x, stageVerts[0].y);
  for (let i = 0; i < stageVertsLength; i++) {
    ctx.lineTo(stageVerts[i].x, stageVerts[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  const lLedge = renderData.stage.Ledges.GetLeftLedge();
  const rLedge = renderData.stage.Ledges.GetRightLedge();

  ctx.fillStyle = 'yellow';
  ctx.beginPath();
  ctx.moveTo(lLedge[0].x, lLedge[0].y);
  for (let i = 0; i < lLedge.length; i++) {
    ctx.lineTo(lLedge[i].x, lLedge[i].y);
  }
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(rLedge[0].x, rLedge[0].y);
  for (let i = 0; i < rLedge.length; i++) {
    ctx.lineTo(rLedge[i].x, rLedge[i].y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawPlayer(ctx: CanvasRenderingContext2D, renderData: RenderData) {
  const player = renderData.player;
  const playerPosX = player.postionx;
  const playerPosY = player.postiony;
  //const ccHull = player.ccHull;
  const facingRight = player.facingRight;

  const ecbColor = 'orange';
  // const ecpOutlineColor = 'white';
  // const prevEcbOutlineColor = 'black';

  ctx.fillStyle = 'red';
  ctx.lineWidth = 3;

  // draw hull
  // ctx.beginPath();
  // ctx.moveTo(ccHull[0].x, ccHull[0].y);
  // for (let i = 0; i < ccHull.length; i++) {
  //   ctx.lineTo(ccHull[i].x, ccHull[i].y);
  // }
  // ctx.closePath();
  // ctx.fill();

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

  //draw ECB
  ctx.fillStyle = ecbColor;
  ctx.strokeStyle = 'purple';
  ctx.beginPath();
  ctx.moveTo(player.currentLeftX, player.currenltLeftY);
  ctx.lineTo(player.currentTopX, player.currentTopY);
  ctx.lineTo(player.currentRightX, player.currentRightY);
  ctx.lineTo(player.currentBottomX, player.currentBottomY);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();

  // draw position marker
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
}
