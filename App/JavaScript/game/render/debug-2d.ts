import { FlatVec } from '../engine/physics/vector';

export class DebugRenderer {
  private ctx: CanvasRenderingContext2D;
  private xRes: number;
  private yRes: number;

  constructor(canvas: HTMLCanvasElement, res: resolution) {
    this.ctx = canvas.getContext('2d')!;
    this.xRes = res.x;
    this.yRes = res.y;
  }

  render(renderDataDTO: RenderData) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.xRes, this.yRes);
    ctx.fillStyle = 'white';
    ctx.fillText(`Frame: ${renderDataDTO.frame}`, 10, 30);
    ctx.fillText(`FrameTime: ${renderDataDTO.frameTime}`, 10, 60);
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
  stage: StageRenderData = new StageRenderData();
  constructor() {}
}

class StageRenderData {
  stage: FlatVec[] = [];
  leftLegd: FlatVec[] = [];
  rightLegd: FlatVec[] = [];
}

class PlayerRenderData {
  postion = new FlatVec(0, 0);
  facingRight = true;
  curEcb: FlatVec[] = new Array<FlatVec>(4);
  prevEcb: FlatVec[] = new Array<FlatVec>(4);
  ccHull: FlatVec[] = new Array<FlatVec>(8);
}

function drawStage(ctx: CanvasRenderingContext2D, renderData: RenderData) {
  const stageVerts = renderData.stage.stage;
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

  const lLedge = renderData.stage.leftLegd;
  const rLedge = renderData.stage.rightLegd;

  ctx.fillStyle = 'yello';
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
  const curEcb = player.curEcb;
  const prevEcb = player.prevEcb;
  const ccHull = player.ccHull;
  const facingRight = player.facingRight;

  const ecbColor = 'organge';
  const ecpOutlineColor = 'white';
  const prevEcbOutlineColor = 'black';

  ctx.fillStyle = ecbColor;

  // draw previous ECB
  ctx.strokeStyle = prevEcbOutlineColor;
  ctx.beginPath();
  ctx.moveTo(prevEcb[0].x, prevEcb[0].y);
  ctx.lineWidth = 2;
  for (let i = 0; i < curEcb.length; i++) {
    ctx.lineTo(curEcb[i].x, curEcb[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.fill();

  // draw ECB
  ctx.strokeStyle = ecpOutlineColor;
  ctx.beginPath();
  ctx.moveTo(curEcb[0].x, curEcb[0].y);
  ctx.lineWidth = 2;
  for (let i = 0; i < curEcb.length; i++) {
    ctx.lineTo(curEcb[i].x, curEcb[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
}
