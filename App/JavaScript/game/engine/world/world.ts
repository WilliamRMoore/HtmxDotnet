import { StateMachine } from '../finite-state-machine/PlayerStateMachine';
import { InputAction } from '../../loops/Input';
import { InputStorageManagerLocal } from '../engine-state-management/Managers';
import { ComponentHistory } from '../player/playerComponents';
import { Player } from '../player/playerOrchestrator';
import { Stage } from '../stage/stageComponents';
import { PooledVector } from '../../pools/PooledVector';
import { Pool } from '../../pools/Pool';
import { CollisionResult } from '../../pools/CollisionResult';
import { ProjectionResult } from '../../pools/ProjectResult';

export class World {
  private players: Array<Player> = [];
  private stage?: Stage;
  private stateMachines: Array<StateMachine> = [];
  public readonly VecPool: Pool<PooledVector>;
  public readonly ColResPool: Pool<CollisionResult>;
  public readonly ProjResPool: Pool<ProjectionResult>;
  public localFrame = 0;
  private readonly InputStorage: Array<InputStorageManagerLocal<InputAction>> =
    [];
  private readonly PlayerComponentHistories: Array<ComponentHistory> = [];

  constructor() {
    this.VecPool = new Pool<PooledVector>(500, () => new PooledVector());
    this.ColResPool = new Pool<CollisionResult>(
      200,
      () => new CollisionResult()
    );
    this.ProjResPool = new Pool<ProjectionResult>(
      500,
      () => new ProjectionResult()
    );
  }

  public SetPlayer(p: Player): void {
    this.players?.push(p);
    this.stateMachines.push(new StateMachine(p, this));
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
