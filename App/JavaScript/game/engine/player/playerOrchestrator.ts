import { Stage } from '../stage/stageComponents';
import { CharacterConfig } from '../../character/default';
import {
  AttackComponment,
  ECBComponent,
  FSMInfoComponent,
  HitStopComponent,
  HitStunComponent,
  HurtCapsules,
  JumpComponent,
  LedgeDetectorComponent,
  PlayerFlagsComponent,
  PlayerPointsComponent,
  PositionComponent,
  SensorComponent,
  SpeedsComponent,
  SpeedsComponentBuilder,
  VelocityComponent,
  WeightComponent,
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
  private readonly weight: WeightComponent;
  private readonly flags: PlayerFlagsComponent;
  private readonly points: PlayerPointsComponent;
  private readonly hitStun: HitStunComponent;
  private readonly hitStop: HitStopComponent;
  private readonly speeds: SpeedsComponent;
  private readonly ecb: ECBComponent;
  private readonly hurtCircles: HurtCapsules;
  private readonly jump: JumpComponent;
  private readonly fsmInfo: FSMInfoComponent;
  private readonly ledgeDetector: LedgeDetectorComponent;
  private readonly sensors: SensorComponent;
  private readonly attacks: AttackComponment;
  public readonly ID: number = 0;

  constructor(Id: number, CharacterConfig: CharacterConfig) {
    const speedsBuilder = CharacterConfig.SCB;
    this.ID = Id;
    this.position = new PositionComponent();
    this.velocity = new VelocityComponent();
    this.weight = new WeightComponent(CharacterConfig.Weight);
    this.speeds = speedsBuilder.Build();
    this.flags = new PlayerFlagsComponent();
    this.points = new PlayerPointsComponent();
    this.hitStun = new HitStunComponent();
    this.hitStop = new HitStopComponent();

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
    this.sensors = new SensorComponent();
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

  public get HitStun(): HitStunComponent {
    return this.hitStun;
  }

  public get HitStop(): HitStopComponent {
    return this.hitStop;
  }

  public get Jump(): JumpComponent {
    return this.jump;
  }

  public get Position(): PositionComponent {
    return this.position;
  }

  public get Velocity(): VelocityComponent {
    return this.velocity;
  }

  public get Weight(): WeightComponent {
    return this.weight;
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

  public get Sensors(): SensorComponent {
    return this.sensors;
  }

  public get Attacks(): AttackComponment {
    return this.attacks;
  }

  public AddWalkImpulseToPlayer(impulse: number): void {
    const velocity = this.velocity;
    const speeds = this.speeds;
    velocity.AddClampedXImpulse(
      speeds.MaxWalkSpeed,
      impulse * speeds.WalkSpeedMulitplier
    );
  }

  public IsPlayerGroundedOnStage(s: Stage): boolean {
    const grnd = s.StageVerticies.GetGround();

    if (grnd == undefined) {
      return false;
    }

    const grndLength = grnd.length - 1;
    for (let i = 0; i < grndLength; i++) {
      const va = grnd[i];
      const vb = grnd[i + 1];
      if (this.ecb.DetectGroundCollision(va, vb)) {
        return true;
      }
    }

    return false;
  }

  public IsPlayerPreviouslyGroundedOnStage(s: Stage): boolean {
    const grnd = s.StageVerticies.GetGround();
    if (grnd == undefined) {
      return false;
    }

    const grndLength = grnd.length - 1;
    for (let i = 0; i < grndLength; i++) {
      const va = grnd[i];
      const vb = grnd[i + 1];
      if (this.ecb.DetectPreviousGroundCollision(va, vb)) {
        return true;
      }
    }

    return false;
  }

  public SetPlayerPosition(x: number, y: number) {
    const position = this.position;
    this.Position;
    position.X = x;
    position.Y = y;
    this.ecb.MoveToPosition(x, y);
    this.ledgeDetector.MoveTo(x, y);
  }

  public AddToPlayerPosition(x: number, y: number): void {
    const pos = this.position;
    pos.X += x;
    pos.Y += y;
    this.ecb.MoveToPosition(pos.X, pos.Y);
    this.ledgeDetector.MoveTo(pos.X, pos.Y);
  }

  public AddToPlayerYPosition(y: number): void {
    const position = this.position;
    position.Y += y;
    this.ecb.MoveToPosition(position.X, position.Y);
    this.ledgeDetector.MoveTo(position.X, position.Y);
  }

  public SetPlayerInitialPosition(x: number, y: number): void {
    this.Position.X = x;
    this.Position.Y = y;
    this.ecb.SetInitialPosition(x, y);
    this.ledgeDetector.MoveTo(x, y);
  }
}
