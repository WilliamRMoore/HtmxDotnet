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
    this.renderDataDto.frameTime = frameTime;
    this.renderDataDto.frame = this.localFrame;
    playerRenderData.playerState =
      this._world.StateMachine?.CurrentStateName ?? 'n/a';
    playerRenderData.postionx = worldPlayer?.Postion.x ?? 0;
    playerRenderData.postiony = worldPlayer?.Postion.y ?? 0;
    playerRenderData.facingRight = worldPlayer?.IsFacingRight() ?? true;

    playerRenderData.currentLeftX = worldPlayer?.ECBLeft.x ?? 0;
    playerRenderData.currenltLeftY = worldPlayer?.ECBLeft.y ?? 0;
    playerRenderData.currentRightX = worldPlayer?.ECBRight.x ?? 0;
    playerRenderData.currentRightY = worldPlayer?.ECBRight.y ?? 0;
    playerRenderData.currentTopX = worldPlayer?.ECBTop.x ?? 0;
    playerRenderData.currentTopY = worldPlayer?.ECBTop.y ?? 0;
    playerRenderData.currentBottomX = worldPlayer?.ECBBottom.x ?? 0;
    playerRenderData.currentBottomY = worldPlayer?.ECBBottom.y ?? 0;

    playerRenderData.prevLeftX = worldPlayer?.PrevECBLeft.x ?? 0;
    playerRenderData.prevLeftY = worldPlayer?.PrevECBLeft.y ?? 0;
    playerRenderData.prevRightX = worldPlayer?.PrevECBRight.x ?? 0;
    playerRenderData.prevRightY = worldPlayer?.PrevECBRight.y ?? 0;
    playerRenderData.prevTopX = worldPlayer?.PrevECBTop.x ?? 0;
    playerRenderData.prevTopY = worldPlayer?.PrevECBTop.y ?? 0;
    playerRenderData.prevBottomX = worldPlayer?.PrevECBBottom.x ?? 0;
    playerRenderData.prevBottomY = worldPlayer?.PrevECBBottom.y ?? 0;

    this.renderDataDto.stage = worldStage;

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
