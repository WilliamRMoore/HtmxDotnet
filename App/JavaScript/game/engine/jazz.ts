import { InputAction } from '../loops/Input';
import { RenderData } from '../render/debug-2d';
import { Player } from './player/playerOrchestrator';
import { defaultStage } from './stage/stageComponents';
import {
  ApplyVelocty,
  Gravity,
  PlayerInput,
  StageCollisionDetection,
} from './systems/systems';
import { World } from './world/world';

export class Jazz {
  private renderDataCallBack: (rd: RenderData) => void;
  private readonly renderDataDto = new RenderData();
  private readonly _world: World;

  constructor(renderDataCallBack: (rd: RenderData) => void) {
    this.renderDataCallBack = renderDataCallBack;
    this._world = new World();
  }

  public get World(): World | undefined {
    return this._world;
  }

  public Init(): void {
    const p = new Player(0);
    const s = defaultStage();
    this._world.SetPlayer(p);
    this._world.SetStage(s);
  }

  public tick() {
    let frameTimeStart = performance.now();

    this.Tick();

    let frameTimeDelta = performance.now() - frameTimeStart;

    this.renderDataCallBackExec(frameTimeDelta);
  }

  public UpdateLocalInputForCurrentFrame(ia: InputAction, pIndex: number) {
    this.UpdateLocalInput(pIndex, ia, this.localFrame);
  }

  private UpdateLocalInput(
    pIndex: number,
    inputAction: InputAction,
    frameNumber: number
  ) {
    this._world
      .GetInputManager(pIndex)
      .StoreInputForFrame(frameNumber, inputAction);
  }

  private renderDataCallBackExec(frameTime: number = 0) {
    const worldPlayer = this._world.Player;
    const worldStage = this._world.Stage;
    const playerRenderData = this.renderDataDto.player;
    const stageRenderData = this.renderDataDto.stage;
    this.renderDataDto.frameTime = frameTime;
    this.renderDataDto.frame = this.localFrame;
    playerRenderData.postion.x = worldPlayer?.Postion.x ?? 0;
    playerRenderData.postion.y = worldPlayer?.Postion.y ?? 0;
    playerRenderData.facingRight = worldPlayer?.IsFacingRight() ?? true;

    const curEcb = worldPlayer?.GetECBVerts();
    const curEcbLength = curEcb?.length ?? 0;
    playerRenderData.curEcb.length = curEcbLength;
    for (let i = 0; i < curEcbLength; i++) {
      const vec = playerRenderData.curEcb[i];
      const newVec = curEcb![i];
      vec.x = newVec.x;
      vec.y = newVec.y;
    }

    const prevEcb = worldPlayer?.GetPrevECBVerts();
    const prevEcbLength = prevEcb?.length ?? 0;
    playerRenderData.curEcb.length = prevEcbLength;
    for (let i = 0; i < prevEcbLength; i++) {
      const vec = playerRenderData.prevEcb[i];
      const newVec = prevEcb![i];
      vec.x = newVec.x;
      vec.y = newVec.y;
    }

    const ccHull = worldPlayer?.GetCCHull();
    const ccHullLength = ccHull?.length ?? 0;
    playerRenderData.ccHull.length = ccHullLength;
    for (let i = 0; i < ccHullLength; i++) {
      const vec = playerRenderData.ccHull[i];
      const newVec = ccHull![i];
      vec.x = newVec.x;
      vec.y = newVec.y;
    }

    const stageVerts = worldStage?.StageVerticies.GetVerts();

    stageRenderData.stage = stageVerts ?? [];
    stageRenderData.leftLegd = worldStage?.Ledges.GetLeftLedge() ?? [];
    stageRenderData.rightLegd = worldStage?.Ledges.GetRightLedge() ?? [];

    this.renderDataCallBack(this.renderDataDto);
  }

  private Tick() {
    const world = this._world;

    PlayerInput(world);
    Gravity(world);
    ApplyVelocty(world);
    StageCollisionDetection(world);

    world.Player?.PostTickTask();
    world?.VecPool.Zero();
    world?.ColResPool.Zero();
    world?.ProjResPool.Zero();

    world.localFrame++;
  }

  private get localFrame() {
    return this._world.localFrame;
  }

  private set localFrame(frame: number) {
    this._world.localFrame = frame;
  }
}
