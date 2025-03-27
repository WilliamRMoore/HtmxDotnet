import { StateMachine } from '../FSM/FiniteStateMachine';
import { InputAction } from '../loops/Input';
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
    p.SetStateMachine(new StateMachine(p));
    const s = defaultStage();
    this._world.SetPlayer(p);
    this._world.SetStage(s);
    p.SetWorld(this._world);
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
    this.renderDataDto.frameTime = frameTime;
    this.renderDataDto.frame = this.localFrame;
    this.renderDataCallBack(this.renderDataDto);
  }

  private Tick() {
    const p1Input = this._world
      .GetInputManager(this.World!.Player!.ID)
      .GetInputForFrame(this.localFrame);

    const p = this._world!.Player!;
    const s = this._world!.Stage!;

    PlayerInput(p, p1Input);
    Gravity(p);
    ApplyVelocty(p);
    StageCollisionDetection(
      p,
      s,
      this._world!.VecPool,
      this._world!.ColResPool,
      this._world!.ProjResPool
    );

    p.PostTickTask();
    this._world?.VecPool.Zero();
    this._world?.ColResPool.Zero();
    this._world?.ProjResPool.Zero();

    this.localFrame++;
  }

  private get localFrame() {
    return this._world.localFrame;
  }

  private set localFrame(frame: number) {
    this._world.localFrame = frame;
  }
}
