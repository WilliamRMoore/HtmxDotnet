import { STATES } from '../FSM/FiniteState';
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

export class Jazz {
  private renderDataCallBack: (rd: RenderData) => void;
  private readonly renderDataDto = new RenderData();
  private localFrame = 0;
  private LocalInputStorage: InputStorageManagerLocal<InputAction> =
    new InputStorageManagerLocal<InputAction>();
  private player: Player = new Player();
  private stage: Stage = defaultStage();

  constructor(renderDataCallBack: (rd: RenderData) => void) {
    this.renderDataCallBack = renderDataCallBack;
  }

  public UpdateLocalInput(inputAction: InputAction, frameNumber: number) {
    this.LocalInputStorage.StoreLocalInputForP1(frameNumber, inputAction);
  }

  public Reset(): void {}

  public tick() {
    this.localFrame++;
    let frameTimeStart = performance.now();
    const p1Input = this.LocalInputStorage.GetP1LocalInputForFrame(
      this.localFrame
    );
    PlayerInput(this.player, p1Input);
    Gravity(this.player);
    ApplyVelocty(this.player);
    const colided = StageCollisionDetection(this.player, this.stage);
    if (
      (colided && this.player.GetCurrentFSMStateId() == STATES.N_FALL) ||
      this.player.GetCurrentFSMStateId() == STATES.F_FALL
    ) {
    }
    let frameTimeDelta = performance.now() - frameTimeStart;

    this.renderDataCallBackExec(frameTimeDelta);
  }

  private extractInput(message: MessageProtocol): InputAction {
    this.localFrame = message.frame;
    return message.inputAction;
  }

  private renderDataCallBackExec(frameTime: number = 0) {
    this.renderDataDto.frameTime = frameTime;
    this.renderDataDto.frame = this.localFrame;
    this.renderDataCallBack(this.renderDataDto);
  }
}
