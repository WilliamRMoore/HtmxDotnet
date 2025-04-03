import { StateMachine } from '../../FSM/FiniteStateMachine';
import { InputAction } from '../../loops/Input';
import { CollisionResultPool } from '../../pools/CollisionResultPool';
import { ProjectionResultPool } from '../../pools/ProjectResultPool';
import { VecPool } from '../../pools/VecResultPool';
import { InputStorageManagerLocal } from '../engine-state-management/Managers';
import { Player } from '../player/playerOrchestrator';
import { Stage } from '../stage/stageComponents';

export class World {
  private player?: Player;
  private stage?: Stage;
  private stateMachine?: StateMachine;
  public readonly VecPool: VecPool;
  public readonly ColResPool: CollisionResultPool;
  public readonly ProjResPool: ProjectionResultPool;
  public localFrame = 0;
  private readonly InputStorage: Array<InputStorageManagerLocal<InputAction>> =
    new Array<InputStorageManagerLocal<InputAction>>();

  constructor() {
    this.VecPool = new VecPool(500);
    this.ColResPool = new CollisionResultPool(200);
    this.ProjResPool = new ProjectionResultPool(500);
    this.InputStorage[0] = new InputStorageManagerLocal<InputAction>();
    this.InputStorage[1] = new InputStorageManagerLocal<InputAction>();
  }

  public SetPlayer(p: Player): void {
    this.player = p;
    this.stateMachine = new StateMachine(p);
  }

  public SetStage(s: Stage) {
    this.stage = s;
  }

  public get Player(): Player | undefined {
    return this.player;
  }

  public get StateMachine(): StateMachine | undefined {
    return this.stateMachine;
  }

  public get Stage(): Stage | undefined {
    return this.stage;
  }

  public GetPlayerPreviousInput(playerId: number): InputAction | undefined {
    return this.InputStorage[playerId].GetInputForFrame(this.localFrame - 1);
  }

  public GetInputManager(
    playerIndex: number
  ): InputStorageManagerLocal<InputAction> {
    return this.InputStorage[playerIndex];
  }
}
