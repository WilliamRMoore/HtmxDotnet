import { STATES } from '../FSM/FiniteState';
import { StateMachine } from '../FSM/FiniteStateMachine';
import { InputAction } from '../loops/Input';
import { MessageProtocol, MessageTypes } from '../network/protocol';
import { RenderData } from '../render/debug-2d';
import { InputStorageManagerLocal } from './engine-state-management/Managers';
import { Player } from './player/playerOrchestrator';
import { defaultStage, Stage } from './stage/stageComponents';
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
  private localFrame = 0;
  private LocalInputStorage: InputStorageManagerLocal<InputAction> =
    new InputStorageManagerLocal<InputAction>();
  private _world?: World;

  constructor(renderDataCallBack: (rd: RenderData) => void) {
    this.renderDataCallBack = renderDataCallBack;
  }

  public get World(): World | undefined {
    return this._world;
  }

  public Init(): void {
    const p = new Player();
    p.SetStateMachine(new StateMachine(p));
    const s = defaultStage();
    this._world = new World(p, s);
    p.SetWorld(this._world);
  }

  public tick() {
    let frameTimeStart = performance.now();

    const p1Input = this.LocalInputStorage.GetP1LocalInputForFrame(
      this.localFrame
    );
    const p = this._world!.player!;
    const s = this._world!.stage!;

    PlayerInput(p, p1Input);
    Gravity(p);
    ApplyVelocty(p);
    StageCollisionDetection(p, s);

    this.PostTick();

    let frameTimeDelta = performance.now() - frameTimeStart;

    this.renderDataCallBackExec(frameTimeDelta);

    this.localFrame++;
  }

  public UpdateLocalInputForCurrentFrame(ia: InputAction) {
    this.UpdateLocalInput(ia, this.localFrame);
  }

  private UpdateLocalInput(inputAction: InputAction, frameNumber: number) {
    this.LocalInputStorage.StoreLocalInputForP1(frameNumber, inputAction);
  }

  private renderDataCallBackExec(frameTime: number = 0) {
    this.renderDataDto.frameTime = frameTime;
    this.renderDataDto.frame = this.localFrame;
    this.renderDataCallBack(this.renderDataDto);
  }

  private PostTick() {
    this._world?.player?.PreFrameEndTask();
  }
}
