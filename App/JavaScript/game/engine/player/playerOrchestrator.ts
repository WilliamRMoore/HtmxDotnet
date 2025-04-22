import { Stage } from '../stage/stageComponents';
import {
  ECBComponent,
  FSMInfoComponent,
  JumpComponent,
  LedgeDetectorComponent,
  PlayerFlagsComponent,
  PositionComponent,
  SpeedsComponent,
  SpeedsComponentBuilder,
  VelocityComponent,
} from './playerComponents';

type speedBuilderOptions = (scb: SpeedsComponentBuilder) => void;

const defaultSpeedsBuilderOptions: speedBuilderOptions = (
  scb: SpeedsComponentBuilder
) => {
  scb.SetWalkSpeeds(10, 2);
  scb.SetRunSpeeds(15, 2.2);
  scb.SetFallSpeeds(21, 15, 0.5);
  scb.SetAerialSpeeds(0.8, 18, 2);
  scb.SetDashSpeeds(3, 20);
  scb.SetGroundedVelocityDecay(1);
};

export class Player {
  private readonly position: PositionComponent;
  private readonly velocity: VelocityComponent;
  private readonly flags: PlayerFlagsComponent;
  private readonly speeds: SpeedsComponent;
  private readonly ecb: ECBComponent;
  private readonly jump: JumpComponent;
  private readonly fsmInfo: FSMInfoComponent;
  private readonly ledgeDetector: LedgeDetectorComponent;
  public readonly ID: number = 0;

  constructor(
    Id: number,
    sbo: speedBuilderOptions = defaultSpeedsBuilderOptions
  ) {
    const speedsBuilder = new SpeedsComponentBuilder();
    sbo(speedsBuilder);

    this.ID = Id;
    this.position = new PositionComponent();
    this.velocity = new VelocityComponent();
    this.speeds = speedsBuilder.Build();
    this.flags = new PlayerFlagsComponent();
    this.ecb = new ECBComponent();
    this.jump = new JumpComponent(20, 2);
    this.fsmInfo = new FSMInfoComponent();
    this.ledgeDetector = new LedgeDetectorComponent(
      this.position.X,
      this.position.Y,
      70,
      30
    );
  }

  public get ECBComponent(): ECBComponent {
    return this.ecb;
  }

  public get FlagsComponent(): PlayerFlagsComponent {
    return this.flags;
  }

  public get JumpComponent(): JumpComponent {
    return this.jump;
  }

  public get PostionComponent(): PositionComponent {
    return this.position;
  }

  public get VelocityComponent(): VelocityComponent {
    return this.velocity;
  }

  public get SpeedsComponent(): SpeedsComponent {
    return this.speeds;
  }

  public get FSMInfoComponent(): FSMInfoComponent {
    return this.fsmInfo;
  }

  public get LedgeDetectorComponent(): LedgeDetectorComponent {
    return this.ledgeDetector;
  }
}

export class PlayerHelpers {
  public static AddWalkImpulseToPlayer(p: Player, impulse: number): void {
    const velocity = p.VelocityComponent;
    const speeds = p.SpeedsComponent;
    velocity.AddClampedXImpulse(
      speeds.MaxWalkSpeed,
      impulse * speeds.WalkSpeedMulitplier
    );
  }

  public static AddRunImpulseToPlayer(p: Player, impulse: number): void {
    const velocity = p.VelocityComponent;
    const speeds = p.SpeedsComponent;
    velocity.AddClampedXImpulse(
      speeds.MaxRunSpeed,
      impulse * speeds.RunSpeedMultiplier
    );
  }

  public static AddGravityToPlayer(p: Player, s: Stage): void {
    if (!this.IsPlayerGroundedOnStage(p, s)) {
      const speeds = p.SpeedsComponent;
      const grav = speeds.Gravity;
      const isFF = p.FlagsComponent.IsFastFalling();
      const fallSpeed = isFF ? speeds.FastFallSpeed : speeds.FallSpeed;
      const GravMutliplier = isFF ? 1.4 : 1;
      p.VelocityComponent.AddClampedYImpulse(fallSpeed, grav * GravMutliplier);
    }
  }

  public static IsPlayerGroundedOnStage(p: Player, s: Stage): boolean {
    const grnd = s.StageVerticies.GetGround();

    if (grnd == undefined) {
      return false;
    }

    const grndLength = grnd.length - 1;
    for (let i = 0; i < grndLength; i++) {
      const va = grnd[i];
      const vb = grnd[i + 1];
      if (p.ECBComponent.DetectGroundCollision(va, vb)) {
        return true;
      }
    }

    return false;
  }

  public static IsPlayerPreviouslyGroundedOnStage(
    p: Player,
    s: Stage
  ): boolean {
    const grnd = s.StageVerticies.GetGround();
    if (grnd == undefined) {
      return false;
    }

    const grndLength = grnd.length - 1;
    for (let i = 0; i < grndLength; i++) {
      const va = grnd[i];
      const vb = grnd[i + 1];
      if (p.ECBComponent.DetectPreviousGroundCollision(va, vb)) {
        return true;
      }
    }

    return false;
  }

  public static SetPlayerPosition(p: Player, x: number, y: number) {
    p.PostionComponent.X = x;
    p.PostionComponent.Y = y;
    p.ECBComponent.MoveToPosition(x, y);
    p.LedgeDetectorComponent.MoveTo(x, y);
  }

  public static SetPlayerInitialPosition(
    p: Player,
    x: number,
    y: number
  ): void {
    p.PostionComponent.X = x;
    p.PostionComponent.Y = y;
    p.ECBComponent.SetInitialPosition(x, y);
    p.LedgeDetectorComponent.MoveTo(x, y);
  }

  public static AddToPlayerYPosition(p: Player, y: number): void {
    const position = p.PostionComponent;
    position.Y += y;
    p.ECBComponent.MoveToPosition(position.X, position.Y);
    p.LedgeDetectorComponent.MoveTo(position.X, position.Y);
  }

  public static AddToPlayerPosition(p: Player, x: number, y: number): void {
    const pos = p.PostionComponent;
    pos.X += x;
    pos.Y += y;
    p.ECBComponent.MoveToPosition(pos.X, pos.Y);
    p.LedgeDetectorComponent.MoveTo(pos.X, pos.Y);
  }
}
