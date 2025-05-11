import { Stage } from '../stage/stageComponents';
import { CharacterConfig } from '../../character/default';
import {
  AttackComponment,
  ECBComponent,
  FSMInfoComponent,
  HurtCapsules,
  JumpComponent,
  LedgeDetectorComponent,
  PlayerFlagsComponent,
  PlayerPointsComponent,
  PositionComponent,
  SpeedsComponent,
  SpeedsComponentBuilder,
  VelocityComponent,
} from './playerComponents';

export type speedBuilderOptions = (scb: SpeedsComponentBuilder) => void;

const defaultSpeedsBuilderOptions: speedBuilderOptions = (
  scb: SpeedsComponentBuilder
) => {
  scb.SetWalkSpeeds(11, 2);
  scb.SetRunSpeeds(14, 2.2);
  scb.SetFallSpeeds(22, 15, 0.7);
  scb.SetAerialSpeeds(0.5, 13, 1.8);
  scb.SetDashSpeeds(3, 17);
  scb.SetAirDodgeSpeed(25);
  scb.SetGroundedVelocityDecay(0.8);
};

export class Player {
  private readonly position: PositionComponent;
  private readonly velocity: VelocityComponent;
  private readonly flags: PlayerFlagsComponent;
  private readonly points: PlayerPointsComponent;
  private readonly speeds: SpeedsComponent;
  private readonly ecb: ECBComponent;
  private readonly hurtCircles: HurtCapsules;
  private readonly jump: JumpComponent;
  private readonly fsmInfo: FSMInfoComponent;
  private readonly ledgeDetector: LedgeDetectorComponent;
  private readonly attacks: AttackComponment;
  public readonly ID: number = 0;

  constructor(Id: number, CharacterConfig: CharacterConfig) {
    const speedsBuilder = CharacterConfig.SCB;
    this.ID = Id;
    this.position = new PositionComponent();
    this.velocity = new VelocityComponent();
    this.speeds = speedsBuilder.Build();
    this.flags = new PlayerFlagsComponent();
    this.points = new PlayerPointsComponent();
    this.ecb = new ECBComponent(
      CharacterConfig.ECBHeight,
      CharacterConfig.ECBWidth,
      CharacterConfig.ECBOffset
    );
    this.hurtCircles = new HurtCapsules(CharacterConfig.HurtCapsules);
    this.jump = new JumpComponent(
      CharacterConfig.JumpVelocity,
      CharacterConfig.NumberOfJumps
    );
    this.fsmInfo = new FSMInfoComponent(CharacterConfig.FrameLengths);
    this.ledgeDetector = new LedgeDetectorComponent(
      this.position.X,
      this.position.Y,
      CharacterConfig.LedgeBoxWidth,
      CharacterConfig.LedgeBoxHeight,
      CharacterConfig.ledgeBoxYOffset
    );
    this.attacks = new AttackComponment(CharacterConfig.attacks);
  }

  public get ECB(): ECBComponent {
    return this.ecb;
  }

  public get HurtBubbles(): HurtCapsules {
    return this.hurtCircles;
  }

  public get Flags(): PlayerFlagsComponent {
    return this.flags;
  }

  public get Points(): PlayerPointsComponent {
    return this.points;
  }

  public get Jump(): JumpComponent {
    return this.jump;
  }

  public get Postion(): PositionComponent {
    return this.position;
  }

  public get Velocity(): VelocityComponent {
    return this.velocity;
  }

  public get Speeds(): SpeedsComponent {
    return this.speeds;
  }

  public get FSMInfo(): FSMInfoComponent {
    return this.fsmInfo;
  }

  public get LedgeDetector(): LedgeDetectorComponent {
    return this.ledgeDetector;
  }

  public get Attacks(): AttackComponment {
    return this.attacks;
  }
}

export class PlayerHelpers {
  public static AddWalkImpulseToPlayer(p: Player, impulse: number): void {
    const velocity = p.Velocity;
    const speeds = p.Speeds;
    velocity.AddClampedXImpulse(
      speeds.MaxWalkSpeed,
      impulse * speeds.WalkSpeedMulitplier
    );
  }

  public static AddRunImpulseToPlayer(p: Player, impulse: number): void {
    const velocity = p.Velocity;
    const speeds = p.Speeds;
    velocity.AddClampedXImpulse(
      speeds.MaxRunSpeed,
      impulse * speeds.RunSpeedMultiplier
    );
  }

  public static AddGravityToPlayer(p: Player, s: Stage): void {
    if (!this.IsPlayerGroundedOnStage(p, s)) {
      const speeds = p.Speeds;
      const grav = speeds.Gravity;
      const isFF = p.Flags.IsFastFalling();
      const fallSpeed = isFF ? speeds.FastFallSpeed : speeds.FallSpeed;
      const GravMutliplier = isFF ? 1.4 : 1;
      p.Velocity.AddClampedYImpulse(fallSpeed, grav * GravMutliplier);
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
      if (p.ECB.DetectGroundCollision(va, vb)) {
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
      if (p.ECB.DetectPreviousGroundCollision(va, vb)) {
        return true;
      }
    }

    return false;
  }

  public static SetPlayerPosition(p: Player, x: number, y: number) {
    p.Postion.X = x;
    p.Postion.Y = y;
    p.ECB.MoveToPosition(x, y);
    p.LedgeDetector.MoveTo(x, y);
  }

  public static SetPlayerInitialPosition(
    p: Player,
    x: number,
    y: number
  ): void {
    p.Postion.X = x;
    p.Postion.Y = y;
    p.ECB.SetInitialPosition(x, y);
    p.LedgeDetector.MoveTo(x, y);
  }

  public static AddToPlayerYPosition(p: Player, y: number): void {
    const position = p.Postion;
    position.Y += y;
    p.ECB.MoveToPosition(position.X, position.Y);
    p.LedgeDetector.MoveTo(position.X, position.Y);
  }

  public static AddToPlayerPosition(p: Player, x: number, y: number): void {
    const pos = p.Postion;
    pos.X += x;
    pos.Y += y;
    p.ECB.MoveToPosition(pos.X, pos.Y);
    p.LedgeDetector.MoveTo(pos.X, pos.Y);
  }
}
