import { GameEvents } from '../FSM/FiniteState';
import { StateMachine } from '../FSM/FiniteStateMachine';
import { InputAction } from '../loops/Input';
import { RenderData } from '../render/debug-2d';
import { Player } from './player/playerOrchestrator';
import { defaultStage } from './stage/stageComponents';
import {
  ApplyVelocty,
  Gravity,
  OutOfBoundsCheck,
  PlayerInput,
  StageCollisionDetection,
} from './systems/systems';
import { World } from './world/world';

export interface IJazz {
  get World(): World | undefined;
  Init(): void;
  Tick(): void;
  UpdateLocalInputForCurrentFrame(ia: InputAction, pIndex: number): void;
}

export class Jazz implements IJazz {
  private readonly renderDataDto: RenderData;
  private readonly _world: World;

  constructor(rd: RenderData) {
    this.renderDataDto = rd;
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

  public Tick() {
    let frameTimeStart = performance.now();

    this._tick();

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

    const ecb = worldPlayer?.ECBComponent;

    playerRenderData.currentLeftX = ecb?.Left?.x ?? 0;
    playerRenderData.currenltLeftY = ecb?.Left?.y ?? 0;
    playerRenderData.currentRightX = ecb?.Right?.x ?? 0;
    playerRenderData.currentRightY = ecb?.Right?.y ?? 0;
    playerRenderData.currentTopX = ecb?.Top?.x ?? 0;
    playerRenderData.currentTopY = ecb?.Top?.y ?? 0;
    playerRenderData.currentBottomX = ecb?.Bottom?.x ?? 0;
    playerRenderData.currentBottomY = ecb?.Bottom?.y ?? 0;

    playerRenderData.prevLeftX = ecb?.PrevLeft.x ?? 0;
    playerRenderData.prevLeftY = ecb?.PrevLeft.y ?? 0;
    playerRenderData.prevRightX = ecb?.PrevRight.x ?? 0;
    playerRenderData.prevRightY = ecb?.PrevRight.y ?? 0;
    playerRenderData.prevTopX = ecb?.PrevTop.x ?? 0;
    playerRenderData.prevTopY = ecb?.PrevTop.y ?? 0;
    playerRenderData.prevBottomX = ecb?.PrevBottom.x ?? 0;
    playerRenderData.prevBottomY = ecb?.PrevBottom.y ?? 0;

    this.renderDataDto.stage = worldStage;
  }

  private _tick() {
    const world = this._world;

    const player = world.Player;
    player?.PostTickTask();

    PlayerInput(world);
    Gravity(world);
    ApplyVelocty(world);
    StageCollisionDetection(world);
    OutOfBoundsCheck(world);

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

export class JazzDebugger implements IJazz {
  private _jazz: Jazz;
  private _renderData: RenderData | undefined;
  private paused: boolean = false;
  private previousInput: InputAction | undefined = undefined;
  private advanceFrame: boolean = false;

  constructor(renderData: RenderData) {
    this._jazz = new Jazz(renderData);
    this._renderData = renderData;
  }

  UpdateLocalInputForCurrentFrame(ia: InputAction, pIndex: number): void {
    this.TogglePause(ia);

    if (this.paused) {
      if (this.AdvanceOneFrame(ia)) {
        this.advanceFrame = true;
        this._jazz.UpdateLocalInputForCurrentFrame(ia, pIndex);
      }
      this.previousInput = ia;
      return;
    }

    this._jazz.UpdateLocalInputForCurrentFrame(ia, pIndex);
    this.previousInput = ia;
  }

  public Init(): void {
    this._jazz.Init();
  }

  public Tick(): void {
    if (this.paused && this.advanceFrame) {
      this.advanceFrame = false;
      this._jazz.Tick();
      return;
    }
    this._jazz.Tick();
  }

  public get World(): World | undefined {
    return this._jazz.World;
  }

  private TogglePause(ia: InputAction): void {
    const PausedPreviouisInput = this.previousInput?.Start ?? false;
    const PausedCurrentInput = ia.Start ?? false;

    if (PausedPreviouisInput == false && PausedCurrentInput) {
      this.paused = !this.paused;
    }
  }

  private AdvanceOneFrame(ia: InputAction): boolean {
    const selectPressed = ia.Select ?? false;
    const selectHeld = this.previousInput?.Select ?? false;

    return selectPressed && !selectHeld;
  }
}
