import { StateMachine } from '../../FSM/FiniteStateMachine';
import { Player } from '../player/playerOrchestrator';
import { Stage } from '../stage/stageComponents';

export class World {
  public readonly player?: Player;
  public readonly stage?: Stage;
  constructor(p: Player, s: Stage) {
    this.player = p;
    this.stage = s;
  }
}
