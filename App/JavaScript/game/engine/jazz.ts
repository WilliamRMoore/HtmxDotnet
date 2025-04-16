import { InputAction } from '../loops/Input';
import { RenderData } from '../render/debug-2d';
import { FlatVec } from './physics/vector';
import { Player } from './player/playerOrchestrator';
import { defaultStage } from './stage/stageComponents';
import {
  ApplyVelocty,
  Gravity,
  LedgeGrabDetection,
  OutOfBoundsCheck,
  PlayerInput,
  StageCollisionDetection,
} from './systems/systems';
import { World } from './world/world';

export interface IJazz {
  get World(): World | undefined;
  Init(numberOfPlayers: number): void;
  Tick(): void;
  UpdateLocalInputForCurrentFrame(ia: InputAction, pIndex: number): void;
}

export class Jazz implements IJazz {
  private readonly renderDataDto: RenderData;
  private readonly world: World;

  constructor(rd: RenderData) {
    this.renderDataDto = rd;
    this.world = new World();
  }

  public get World(): World | undefined {
    return this.world;
  }

  public Init(numberOfPlayers: number): void {
    for (let i = 0; i < numberOfPlayers; i++) {
      const p = new Player(i);
      this.world.SetPlayer(p);
    }
    const s = defaultStage();
    this.world.SetStage(s);
  }

  public Tick() {
    let frameTimeStart = performance.now();

    this.tick();

    let frameTimeDelta = performance.now() - frameTimeStart;

    this.renderDataCopy(frameTimeDelta);

    const world = this.World;
    world?.VecPool.Zero();
    world?.ColResPool.Zero();
    world?.ProjResPool.Zero();
  }

  public UpdateLocalInputForCurrentFrame(ia: InputAction, pIndex: number) {
    this.UpdateLocalInput(pIndex, ia, this.localFrame);
  }

  private UpdateLocalInput(
    pIndex: number,
    inputAction: InputAction,
    frameNumber: number
  ) {
    this.world
      .GetInputManager(pIndex)
      .StoreInputForFrame(frameNumber, inputAction);
  }

  private tick() {
    const world = this.world;

    const playerCount = world.PlayerCount;

    for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
      const player = world.GetPlayer(playerIndex);
      player?.ECBComponent.UpdatePreviousECB();
    }

    PlayerInput(world);
    Gravity(world);
    ApplyVelocty(world);
    LedgeGrabDetection(world);
    StageCollisionDetection(world);
    OutOfBoundsCheck(world);

    world.localFrame++;
  }

  private renderDataCopy(frameTime: number = 0) {
    this.renderDataDto.frameTime = frameTime;
    this.renderDataDto.frame = this.localFrame;

    const worldStage = this.world.Stage;
    const playerCount = this.world.PlayerCount;

    for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
      const worldPlayer = this.world.GetPlayer(playerIndex);
      const sm = this.world.GetStateMachine(playerIndex);
      const playerRenderData = this.renderDataDto.players[playerIndex];
      playerRenderData.playerState = sm?.CurrentStateName ?? 'N/A';

      playerRenderData.postionx = worldPlayer?.PostionComponent.X ?? 0;
      playerRenderData.postiony = worldPlayer?.PostionComponent.Y ?? 0;
      playerRenderData.facingRight =
        worldPlayer?.FlagsComponent.IsFacingRight() ?? true;

      const ecb = worldPlayer?.ECBComponent;

      playerRenderData.currentLeftX = ecb?.Left?.X ?? 0;
      playerRenderData.currenltLeftY = ecb?.Left?.Y ?? 0;
      playerRenderData.currentRightX = ecb?.Right?.X ?? 0;
      playerRenderData.currentRightY = ecb?.Right?.Y ?? 0;
      playerRenderData.currentTopX = ecb?.Top?.X ?? 0;
      playerRenderData.currentTopY = ecb?.Top?.Y ?? 0;
      playerRenderData.currentBottomX = ecb?.Bottom?.X ?? 0;
      playerRenderData.currentBottomY = ecb?.Bottom?.Y ?? 0;

      playerRenderData.prevLeftX = ecb?.PrevLeft.X ?? 0;
      playerRenderData.prevLeftY = ecb?.PrevLeft.Y ?? 0;
      playerRenderData.prevRightX = ecb?.PrevRight.X ?? 0;
      playerRenderData.prevRightY = ecb?.PrevRight.Y ?? 0;
      playerRenderData.prevTopX = ecb?.PrevTop.X ?? 0;
      playerRenderData.prevTopY = ecb?.PrevTop.Y ?? 0;
      playerRenderData.prevBottomX = ecb?.PrevBottom.X ?? 0;
      playerRenderData.prevBottomY = ecb?.PrevBottom.Y ?? 0;

      const playerLedgeDetectorComponent = worldPlayer?.LedgeDetectorComponent!;

      const leftLedgeDetectorLength =
        playerLedgeDetectorComponent.LeftSide.length;

      for (let index = 0; index < leftLedgeDetectorLength; index++) {
        const renderData = playerRenderData.leftLedgeDetector[index];
        const playerData = playerLedgeDetectorComponent.LeftSide[index];

        renderData.X = playerData.X;
        renderData.Y = playerData.Y;
      }

      const rightLedgeDetectorLength =
        playerLedgeDetectorComponent.LeftSide.length;

      for (let index = 0; index < rightLedgeDetectorLength; index++) {
        const renderData = playerRenderData.rightLedgeDetector[index];
        const playerData = playerLedgeDetectorComponent.RightSide[index];

        renderData.X = playerData.X;
        renderData.Y = playerData.Y;
      }

      // const hull = worldPlayer?.ECBComponent.GetHull()!;
      // const hullCopy: Array<FlatVec> = [];
      // const hullLength = hull.length;
      // for (let i = 0; i < hullLength; i++) {
      //   hullCopy.push(new FlatVec(hull[i].X, hull[i].Y));
      // }

      // playerRenderData.hull = hullCopy;
    }
    this.renderDataDto.PooledVectors = this.world.VecPool.ActiveCount;
    this.renderDataDto.PooledProjectionResults =
      this.world.ProjResPool.ActiveCount;
    this.renderDataDto.PooledCollisionResults =
      this.world.ColResPool.ActiveCount;
    this.renderDataDto.stage = worldStage;
  }

  private get localFrame() {
    return this.world.localFrame;
  }

  private set localFrame(frame: number) {
    this.world.localFrame = frame;
  }
}

export class JazzDebugger implements IJazz {
  private jazz: Jazz;
  private paused: boolean = false;
  private previousInput: InputAction | undefined = undefined;
  private advanceFrame: boolean = false;

  constructor(renderData: RenderData) {
    this.jazz = new Jazz(renderData);
  }

  UpdateLocalInputForCurrentFrame(ia: InputAction, pIndex: number): void {
    this.togglePause(ia);

    if (this.paused) {
      if (this.advanceOneFrame(ia)) {
        this.advanceFrame = true;
        this.jazz.UpdateLocalInputForCurrentFrame(ia, pIndex);
      }
      this.previousInput = ia;
      return;
    }

    this.jazz.UpdateLocalInputForCurrentFrame(ia, pIndex);
    this.previousInput = ia;
  }

  public Init(numberOfPlayers: number): void {
    this.jazz.Init(numberOfPlayers);
  }

  public Tick(): void {
    if (this.paused && this.advanceFrame) {
      this.advanceFrame = false;
      this.jazz.Tick();
      return;
    }

    if (!this.paused) {
      this.jazz.Tick();
    }
  }

  public get World(): World | undefined {
    return this.jazz.World;
  }

  private togglePause(ia: InputAction): void {
    const PausedPreviouisInput = this.previousInput?.Start ?? false;
    const PausedCurrentInput = ia.Start ?? false;

    if (PausedPreviouisInput == false && PausedCurrentInput) {
      this.paused = !this.paused;
    }
  }

  private advanceOneFrame(ia: InputAction): boolean {
    const selectPressed = ia.Select ?? false;
    const selectHeld = this.previousInput?.Select ?? false;

    return selectPressed && !selectHeld;
  }
}
