export class FrameStorageManager {
  private readonly INITIAL_FRAME = 0;
  private syncFrame = 0;
  public LocalFrame = this.INITIAL_FRAME;
  public RemoteFrame = this.INITIAL_FRAME;
  public RemoteFrameAdvantage = 0;

  public GetSyncFrame() {
    return this.syncFrame;
  }

  public SetSyncFrame(syncFrame: number) {
    this.syncFrame = syncFrame;
  }
}

export class InputStorageManagerNetworked<Type>
  implements IInputStorageManagerNetworked<Type>
{
  private readonly localInputStore: Array<Type>;
  private readonly remoteInputStore: Array<Type>;
  private readonly guessedInputStore: Array<Type>;
  InvalidGuessedFrameSpec: (guessed: Type, Real: Type) => boolean;

  constructor(invalidGuessedFrameSpec: (guessed: Type, real: Type) => boolean) {
    this.localInputStore = new Array<Type>(1000);
    this.remoteInputStore = new Array<Type>(1000);
    this.guessedInputStore = new Array<Type>(1000);
    this.InvalidGuessedFrameSpec = invalidGuessedFrameSpec;
  }

  public StoreLocalInput(input: Type, frame: number) {
    if (this.localInputStore[frame] === undefined) {
      this.localInputStore[frame] = input;
      return;
    }
  }

  public StoreGuessedInput(input: Type, frame: number) {
    if (this.guessedInputStore[frame] === undefined) {
      this.guessedInputStore[frame] = input;
      return;
    }
  }

  public OverWriteGuessedInput(input: Type, frame: number) {
    if (this.guessedInputStore[frame]) {
      this.guessedInputStore[frame] = input;
    }
  }

  public StoreRemoteInput(input: Type, frame: number) {
    if (this.remoteInputStore[frame] === undefined) {
      this.remoteInputStore[frame] = input;
      return;
    }
  }

  public GetRemoteInputForFrame(frame: number): Type {
    return this.remoteInputStore[frame];
  }

  public GetLastRemoteInput(): Type {
    return this.remoteInputStore[this.remoteInputStore.length - 1];
  }

  public GetLocalInputForFrame(frame: number): Type {
    return this.localInputStore[frame];
  }

  public GetGuessedInputForFrame(frame: number): Type {
    return this.guessedInputStore[frame];
  }

  public ReturnFirstWrongGuess(
    lowerBound: number,
    upperBound: number
  ): number | undefined {
    for (let i = lowerBound; i <= upperBound; i++) {
      const guessed = this.guessedInputStore[i];
      const real = this.remoteInputStore[i];

      if (guessed === undefined) {
        continue;
      }

      if (real === undefined || this.InvalidGuessedFrameSpec(guessed, real)) {
        return i - 1 < 0 ? 0 : i - 1;
      }
    }
    return undefined;
  }
}

export interface IInputStorageManagerNetworked<Type> {
  StoreLocalInput(input: Type, frame: number): void;
  StoreGuessedInput(input: Type, frame: number): void;
  OverWriteGuessedInput(input: Type, frame: number): void;
  StoreRemoteInput(input: Type, frame: number): void;
  GetRemoteInputForFrame(frame: number): Type;
  GetLastRemoteInput(): Type;
  GetLocalInputForFrame(frame: number): Type;
  GetGuessedInputForFrame(frame: number): Type;
  ReturnFirstWrongGuess(
    lowerBound: number,
    upperBound: number
  ): number | undefined;
}

export function InitISM<Type>(
  invalidSpec: (guessed: Type, real: Type) => boolean
) {
  const ISM = new InputStorageManagerNetworked<Type>(invalidSpec);
  return ISM;
}

export class InputStorageManagerLocal<Type>
  implements IInputStorageManagerLocal<Type>
{
  private readonly P1localInputStore: Array<Type>;

  constructor() {
    this.P1localInputStore = new Array<Type>(1000);
  }

  StoreInputForFrame(frame: number, input: Type): void {
    this.P1localInputStore[frame] = input;
  }

  GetInputForFrame(frame: number): Type {
    return this.P1localInputStore[frame];
  }
}

export interface IInputStorageManagerLocal<Type> {
  StoreInputForFrame(frame: number, input: Type): void;
  GetInputForFrame(frame: number): Type;
}

export class FrameComparisonManager<Type>
  implements IFrameComparisonManager<Type>
{
  private readonly MAX_ROLLBACK_FRAMES = 10000;
  private readonly FRAME_ADVANTAGE_LIMIT = 1;
  private readonly InputStorageManager: InputStorageManagerNetworked<Type>;
  private readonly FrameStorageManager: FrameStorageManager;

  constructor(
    inputStorageManager: InputStorageManagerNetworked<Type>,
    frameStorageManager: FrameStorageManager
  ) {
    this.InputStorageManager = inputStorageManager;
    this.FrameStorageManager = frameStorageManager;
  }

  UpdateNextSyncFrame(): void {
    let finalFrame =
      this.FrameStorageManager.RemoteFrame > this.FrameStorageManager.LocalFrame
        ? this.FrameStorageManager.LocalFrame
        : this.FrameStorageManager.RemoteFrame;

    let syncFrame = this.InputStorageManager.ReturnFirstWrongGuess(
      this.FrameStorageManager.GetSyncFrame() + 1,
      finalFrame
    );

    if (syncFrame == undefined) {
      this.FrameStorageManager.SetSyncFrame(finalFrame);
      return;
    }
    this.FrameStorageManager.SetSyncFrame(syncFrame);
  }

  //   GetPreviousSyncFrame(): number {
  //     return this.FrameStorageManager.GetSyncFrames().PreviousSyncFrame;
  //   }

  GetCurrentSyncFrame(): number {
    return this.FrameStorageManager.GetSyncFrame();
  }

  IsWithinFrameAdvatnage(): boolean {
    let localFrameAdvantage = this.GetLocalFrameAdvantage();
    let frameAdvantageDifference =
      localFrameAdvantage - this.FrameStorageManager.RemoteFrameAdvantage;
    return (
      localFrameAdvantage < this.MAX_ROLLBACK_FRAMES &&
      frameAdvantageDifference <= this.FRAME_ADVANTAGE_LIMIT
    );
  }

  ShouldStall(): boolean {
    return !this.IsWithinFrameAdvatnage();
  }

  GetFrameAdvantageDifference(): number {
    return (
      this.GetLocalFrameAdvantage() -
      this.FrameStorageManager.RemoteFrameAdvantage
    );
  }

  GetLocalFrameAdvantage(): number {
    return (
      this.FrameStorageManager.LocalFrame - this.FrameStorageManager.RemoteFrame
    );
  }
}

export interface IFrameComparisonManager<Type> {
  UpdateNextSyncFrame(): void;
  //   GetPreviousSyncFrame(): number;
  GetCurrentSyncFrame(): number;
  IsWithinFrameAdvatnage(): boolean;
  GetFrameAdvantageDifference(): number;
  GetLocalFrameAdvantage(): number;
  ShouldStall(): boolean;
}
