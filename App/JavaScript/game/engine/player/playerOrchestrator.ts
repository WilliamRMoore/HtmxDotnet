import { Stage } from '../stage/stageComponents';
import {
  ECBComponent,
  FSMInfoComponent,
  JumpComponent,
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
  scb.SetAerialSpeeds(0.8, 18);
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
    const speeds = p.SpeedsComponent;
    if (!this.IsPlayerGroundedOnStage(p, s)) {
      const grav = speeds.Gravity;
      const flags = p.FlagsComponent;
      const fallSpeed = flags.IsFastFalling()
        ? speeds.FastFallSpeed
        : speeds.FallSpeed;
      const GravMutliplier = flags.IsFastFalling() ? 1.4 : 1;
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
    p.PostionComponent.x = x;
    p.PostionComponent.y = y;
    p.ECBComponent.MoveToPosition(x, y);
  }

  public static SetPlayerInitialPosition(
    p: Player,
    x: number,
    y: number
  ): void {
    p.PostionComponent.x = x;
    p.PostionComponent.y = y;
    p.ECBComponent.SetInitialPosition(x, y);
  }

  public static AddToPlayerYPosition(p: Player, y: number): void {
    const position = p.PostionComponent;
    position.y += y;
    p.ECBComponent.MoveToPosition(position.x, position.y);
  }

  public static AddToPlayerPosition(p: Player, x: number, y: number): void {
    const pos = p.PostionComponent;
    pos.x += x;
    pos.y += y;
    p.ECBComponent.MoveToPosition(pos.x, pos.y);
  }
}
