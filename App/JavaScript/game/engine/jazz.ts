import { DefaultCharacterConfig } from '../character/default';
import { InputAction } from '../loops/Input';
import { FlatVec } from './physics/vector';
import { Player, PlayerHelpers } from './player/playerOrchestrator';
import { defaultStage } from './stage/stageComponents';
import {
  ApplyVelocty,
  Gravity,
  LedgeGrabDetection,
  OutOfBoundsCheck,
  PlayerAttacks,
  PlayerCollisionDetection,
  PlayerInput,
  RecordHistory,
  StageCollisionDetection,
} from './systems/systems';
import { World } from './world/world';

export interface IJazz {
  get World(): World | undefined;
  Init(numberOfPlayers: number, positions: Array<FlatVec>): void;
  Tick(): void;
  UpdateInputForCurrentFrame(ia: InputAction, pIndex: number): void;
}

export class Jazz implements IJazz {
  private readonly world: World;

  constructor() {
    this.world = new World();
  }

  public get World(): World {
    return this.world;
  }

  public Init(numberOfPlayers: number, positions: Array<FlatVec>): void {
    //const charConfig = new DefaultCharacterConfig();
    for (let i = 0; i < numberOfPlayers; i++) {
      const pos = positions[i];
      const charConfig = new DefaultCharacterConfig();
      const p = new Player(i, charConfig);
      this.world.SetPlayer(p);
      PlayerHelpers.SetPlayerInitialPosition(p, pos.X, pos.Y);
    }
    const s = defaultStage();
    this.world.SetStage(s);
  }

  public Tick() {
    let frameTimeStart = performance.now();

    this.tick();

    let frameTimeDelta = performance.now() - frameTimeStart;

    const world = this.World;
    world.SetFrameTimeForFrame(world.localFrame, frameTimeDelta);
    world.SetFrameTimeStampForFrame(world.localFrame, frameTimeStart);
    world?.VecPool.Zero();
    world?.ColResPool.Zero();
    world?.ProjResPool.Zero();
    world.localFrame++;
  }

  public UpdateInputForCurrentFrame(ia: InputAction, pIndex: number) {
    this.UpdateInput(pIndex, ia, this.localFrame);
  }

  private UpdateInput(
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
      player?.ECB.UpdatePreviousECB();
      player?.Flags.UpdateTimedFlags();
    }

    PlayerInput(world);
    Gravity(world);
    ApplyVelocty(world);
    PlayerCollisionDetection(world);
    LedgeGrabDetection(world);
    StageCollisionDetection(world);
    PlayerAttacks(world);
    OutOfBoundsCheck(world);
    RecordHistory(world);
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

  constructor() {
    this.jazz = new Jazz();
  }

  UpdateInputForCurrentFrame(ia: InputAction, pIndex: number): void {
    this.togglePause(ia);

    if (this.paused) {
      if (this.advanceOneFrame(ia)) {
        this.advanceFrame = true;
        this.jazz.UpdateInputForCurrentFrame(ia, pIndex);
      }
      this.previousInput = ia;
      return;
    }

    this.jazz.UpdateInputForCurrentFrame(ia, pIndex);
    this.previousInput = ia;
  }

  public Init(numberOfPlayers: number, positions: Array<FlatVec>): void {
    this.jazz.Init(numberOfPlayers, positions);
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

  public get World(): World {
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
