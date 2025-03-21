import { FlatVec } from '../physics/vector';
import { World } from '../world/world';
import {
  ECBComponent,
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
  scb.SetWalkSpeeds(12, 2);
  scb.SetRunSpeeds(20, 2.5);
  scb.SetFallSpeeds(10, 15);
  scb.SetAerialSpeeds(0.8, 18);
  scb.SetDashSpeeds(5, 25);
  scb.SetGroundedVelocityDecay(0.8);
};

export class Player {
  private _world?: World;
  private readonly _Position: PositionComponent;
  private readonly _Velocity: VelocityComponent;
  private readonly _Flags: PlayerFlagsComponent;
  private readonly _Speeds: SpeedsComponent;
  private readonly _ECB: ECBComponent;
  private readonly _Jump: JumpComponent;

  constructor(sbo: speedBuilderOptions = defaultSpeedsBuilderOptions) {
    const speedsBuilder = new SpeedsComponentBuilder();
    sbo(speedsBuilder);

    this._Position = new PositionComponent();
    this._Velocity = new VelocityComponent();
    this._Speeds = speedsBuilder.Build();
    this._Flags = new PlayerFlagsComponent();
    this._ECB = new ECBComponent();
    this._Jump = new JumpComponent(20, 2);
  }

  public SetWorld(world: World) {
    this._world = world;
  }

  public AddClampedXImpulse(clamp: number, impulse: number): void {
    this._Velocity.AddClampedXImpulse(clamp, impulse);
  }

  public AddWalkImpulse(impulse: number): void {
    this._Velocity.AddClampedXImpulse(
      this._Speeds.MaxWalkSpeed,
      impulse * this._Speeds.WalkSpeedMulitplier
    );
  }

  public AddRunImpulse(impulse: number): void {
    this._Velocity.AddClampedXImpulse(
      this._Speeds.MaxRunSpeed,
      impulse * this._Speeds.RunSpeedMultiplier
    );

    return;
  }

  public AddDashImpulse(): void {
    if (this.IsFacingRight()) {
      this._Velocity.AddClampedXImpulse(
        this._Speeds.MaxDashSpeed,
        this._Speeds.DashImpulse
      );
      return;
    }

    this._Velocity.AddClampedXImpulse(
      this._Speeds.MaxDashSpeed,
      -this._Speeds.DashImpulse
    );
    return;
  }

  public AddJumpImpulse(): void {
    if (this._Jump.HasJumps()) {
      this._Velocity.Vel.Y = -this._Jump.JumpVelocity;
      this._Jump.IncrementJumps();
    }
  }

  // This method is for inputs from the player
  public AddGravityImpulse(impulse: number, clamp: number): void {
    this._Velocity.AddClampedYImpulse(impulse, clamp);
  }

  public SetXVelocity(vx: number): void {
    this._Velocity.Vel.X = vx;
  }

  public SetYVelocity(vy: number): void {
    this._Velocity.Vel.Y = vy;
  }

  public SetPlayerPostion(x: number, y: number): void {
    this._Position.Pos.X = x;
    this._Position.Pos.Y = y;
    this._ECB.MoveToPosition(x, y);
  }

  public AddToPlayerXPosition(x: number): void {
    this._Position.Pos.X += x;
  }

  public AddToPlayerYPosition(y: number): void {
    this._Position.Pos.Y += y;
  }

  public IsGrounded(): boolean {
    const grnd = this._world?.stage?.StageVerticies?.GetGround() ?? undefined;

    if (grnd == undefined) {
      return false;
    }

    const grndLength = grnd.length - 1;
    for (let i = 0; i < grndLength; i++) {
      const va = grnd[i];
      const vb = grnd[i + 1];
      if (this._ECB.DetectGroundCollision(va, vb)) {
        return true;
      }
    }

    return false;
  }

  public get ECBVerts(): FlatVec[] {
    return this._ECB.GetVerts();
  }

  public get Postion(): FlatVec {
    return this._Position.Pos;
  }

  public get Velocity(): FlatVec {
    return this._Velocity.Vel;
  }

  public get FallSpeed(): number {
    return this._Speeds.FallSpeed;
  }

  public get FastFallSpeed(): number {
    return this._Speeds.FastFallSpeed;
  }

  public get Gravity(): number {
    return this._Speeds.Gravity;
  }

  public get GroundedDecay(): number {
    return this._Speeds.GroundedVelocityDecay;
  }

  public get GroundedVelocityDecay(): number {
    return this._Speeds.GroundedVelocityDecay;
  }

  public get AerialVelocityDecay(): number {
    return this._Speeds.AerialVelocityDecay;
  }

  public FastFallOn(): void {
    this._Flags.FastFallOn();
  }

  public FastFallOff(): void {
    this._Flags.FastFallOff();
  }

  public IsFastFalling(): boolean {
    return this._Flags.IsFastFalling();
  }

  public FaceRight() {
    this._Flags.FaceRight();
  }

  public IsFacingRight(): boolean {
    return this._Flags.IsFacingRight();
  }

  public IsFacingLeft(): boolean {
    return this._Flags.IsFacingLeft();
  }

  public FaceLeft() {
    this._Flags.FaceLeft();
  }

  public ChangeDirections() {
    if (this._Flags.IsFacingRight()) {
      this.FaceLeft();
      return;
    }
    this.FaceRight();
  }
}
