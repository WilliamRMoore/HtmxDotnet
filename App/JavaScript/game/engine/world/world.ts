import { StateMachine } from '../finite-state-machine/PlayerStateMachine';
import { InputAction } from '../../loops/Input';
import { InputStorageManagerLocal } from '../engine-state-management/Managers';
import { ComponentHistory } from '../player/playerComponents';
import { Player } from '../player/playerOrchestrator';
import { Stage } from '../stage/stageComponents';
import { PooledVector } from '../pools/PooledVector';
import { Pool } from '../pools/Pool';
import { CollisionResult } from '../pools/CollisionResult';
import { ProjectionResult } from '../pools/ProjectResult';
import { AttackResult } from '../pools/AttackResult';
import { ClosestPointsResult } from '../pools/ClosestPointsResult';

export class World {
  private players: Array<Player> = [];
  private stage?: Stage;
  private stateMachines: Array<StateMachine> = [];
  public readonly VecPool: Pool<PooledVector>;
  public readonly ColResPool: Pool<CollisionResult>;
  public readonly ProjResPool: Pool<ProjectionResult>;
  public readonly AtkResPool: Pool<AttackResult>;
  public readonly ClstsPntsResPool: Pool<ClosestPointsResult>;
  public localFrame = 0;
  private readonly InputStorage: Array<InputStorageManagerLocal<InputAction>> =
    [];
  private readonly PlayerComponentHistories: Array<ComponentHistory> = [];
  private readonly RentedVecHistory: Array<number> = [];
  private readonly RentedColResHsitory: Array<number> = [];
  private readonly RentedProjResHistory: Array<number> = [];
  private readonly FrameTimes: Array<number> = [];
  private readonly FrameTimeStamps: Array<number> = [];

  constructor() {
    this.VecPool = new Pool<PooledVector>(500, () => new PooledVector());
    this.ColResPool = new Pool<CollisionResult>(
      100,
      () => new CollisionResult()
    );
    this.ProjResPool = new Pool<ProjectionResult>(
      200,
      () => new ProjectionResult()
    );
    this.AtkResPool = new Pool<AttackResult>(100, () => new AttackResult());
    this.ClstsPntsResPool = new Pool<ClosestPointsResult>(
      200,
      () => new ClosestPointsResult()
    );
  }

  public SetPlayer(p: Player): void {
    this.players?.push(p);
    this.stateMachines.push(new StateMachine(p, this));
    this.InputStorage.push(new InputStorageManagerLocal<InputAction>());
    const compHist = new ComponentHistory();
    compHist.StaticPlayerHistory.LedgeDetectorWidth = p.LedgeDetector.Width;
    compHist.StaticPlayerHistory.ledgDetecorHeight = p.LedgeDetector.Height;
    p.HurtBubbles.HurtCapsules.forEach((hc) =>
      compHist.StaticPlayerHistory.HurtCapsules.push(hc)
    );
    this.PlayerComponentHistories.push(compHist);
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

  public GetFrameTimeForFrame(frame: number): number | undefined {
    return this.FrameTimes[frame];
  }

  public SetFrameTimeForFrame(frame: number, frameTime: number): void {
    this.FrameTimes[frame] = frameTime;
  }

  public SetFrameTimeStampForFrame(frame: number, timeStamp: number): void {
    this.FrameTimeStamps[frame] = timeStamp;
  }

  public GetFrameTimeStampForFrame(frame: number): number {
    return this.FrameTimeStamps[frame];
  }

  public GetRentedVecsForFrame(frame: number): number {
    return this.RentedVecHistory[frame];
  }

  public GetRentedColResForFrame(frame: number): number {
    return this.RentedColResHsitory[frame];
  }

  public GetRentedProjResForFrame(frame: number): number {
    return this.RentedProjResHistory[frame];
  }

  public SetPoolHistory(
    frame: number,
    vecs: number,
    colReses: number,
    projReses: number
  ): void {
    this.RentedVecHistory[frame] = vecs;
    this.RentedColResHsitory[frame] = colReses;
    this.RentedProjResHistory[frame] = projReses;
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
