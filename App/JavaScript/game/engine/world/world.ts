import { StateMachine } from '../finite-state-machine/PlayerStateMachine';
import { InputAction } from '../../loops/Input';
import { CollisionResultPool } from '../../pools/CollisionResultPool';
import { ProjectionResultPool } from '../../pools/ProjectResultPool';
import { VecPool } from '../../pools/VecResultPool';
import { InputStorageManagerLocal } from '../engine-state-management/Managers';
import { ComponentHistory } from '../player/playerComponents';
import { Player } from '../player/playerOrchestrator';
import { Stage } from '../stage/stageComponents';

export class World {
  private players: Array<Player> = [];
  private stage?: Stage;
  private stateMachines: Array<StateMachine> = [];
  public readonly VecPool: VecPool;
  public readonly ColResPool: CollisionResultPool;
  public readonly ProjResPool: ProjectionResultPool;
  public localFrame = 0;
  private readonly InputStorage: Array<InputStorageManagerLocal<InputAction>> =
    [];
  private readonly PlayerComponentHistories: Array<ComponentHistory> = [];

  constructor() {
    this.VecPool = new VecPool(500);
    this.ColResPool = new CollisionResultPool(200);
    this.ProjResPool = new ProjectionResultPool(500);
  }

  public SetPlayer(p: Player): void {
    this.players?.push(p);
    this.stateMachines.push(new StateMachine(p));
    this.InputStorage.push(new InputStorageManagerLocal<InputAction>());
  }

  public SetStage(s: Stage) {
    this.stage = s;
  }

  public GetPlayer(index: number): Player | undefined {
    return this.players[index];
  }

  public GetStateMachine(index: number): StateMachine | undefined {
    return this.stateMachines[index];
  }

  public GetComponentHistory(index: number): ComponentHistory | undefined {
    return this.PlayerComponentHistories[index];
  }

  public get Stage(): Stage | undefined {
    return this.stage;
  }

  public GetPlayerPreviousInput(playerId: number): InputAction | undefined {
    return this.InputStorage[playerId].GetInputForFrame(this.localFrame - 1);
  }

  public GetPlayerCurrentInput(playerId: number): InputAction | undefined {
    return this.InputStorage[playerId].GetInputForFrame(this.localFrame);
  }

  public GetInputManager(
    playerIndex: number
  ): InputStorageManagerLocal<InputAction> {
    return this.InputStorage[playerIndex];
  }

  public get PlayerCount(): number {
    return this.players.length;
  }
}
