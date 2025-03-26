import { StateMachine } from '../../FSM/FiniteStateMachine';
import { CollisionResultPool } from '../../pools/CollisionResultPool';
import { ProjectionResultPool } from '../../pools/ProjectResultPool';
import { VecPool } from '../../pools/VecResultPool';
import { Player } from '../player/playerOrchestrator';
import { Stage } from '../stage/stageComponents';

export class World {
  public readonly player?: Player;
  public readonly stage?: Stage;
  public readonly VecPool: VecPool;
  public readonly ColResPool: CollisionResultPool;
  public readonly ProjResPool: ProjectionResultPool;
  constructor(p: Player, s: Stage) {
    this.player = p;
    this.stage = s;
    this.VecPool = new VecPool(500);
    this.ColResPool = new CollisionResultPool(200);
    this.ProjResPool = new ProjectionResultPool(500);
  }
}
