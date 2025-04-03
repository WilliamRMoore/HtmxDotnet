import { stateId } from '../../FSM/FiniteState';
import { FlatVec } from '../physics/vector';
import { Stage } from '../stage/stageComponents';
import {
  ECBComponent,
  FSMInfo,
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
  scb.SetFallSpeeds(21, 15, 0.5);
  scb.SetAerialSpeeds(0.8, 18);
  scb.SetDashSpeeds(5, 25);
  scb.SetGroundedVelocityDecay(0.8);
};

export class Player {
  private readonly _Position: PositionComponent;
  private readonly _Velocity: VelocityComponent;
  private readonly _Flags: PlayerFlagsComponent;
  private readonly _Speeds: SpeedsComponent;
  private readonly _ECB: ECBComponent;
  private readonly _Jump: JumpComponent;
  private readonly _FSMInfo: FSMInfo;
  public readonly ID: number = 0;

  constructor(
    Id: number,
    sbo: speedBuilderOptions = defaultSpeedsBuilderOptions
  ) {
    const speedsBuilder = new SpeedsComponentBuilder();
    sbo(speedsBuilder);

    this.ID = Id;
    this._Position = new PositionComponent();
    this._Velocity = new VelocityComponent();
    this._Speeds = speedsBuilder.Build();
    this._Flags = new PlayerFlagsComponent();
    this._ECB = new ECBComponent();
    this._Jump = new JumpComponent(20, 2);
    this._FSMInfo = new FSMInfo();
  }

  public SetCurrentFSMStateId(sId: stateId): void {
    this._FSMInfo.StateId = sId;
  }

  public GetCurrentFSMStateId(): stateId {
    return this._FSMInfo.StateId;
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
  }

  public AddJumpImpulse(): void {
    if (this._Jump.HasJumps()) {
      this._Velocity.Vel.y = -this._Jump.JumpVelocity;
      this._Jump.IncrementJumps();
    }
  }

  // This method is for inputs from the player
  public AddGravityImpulse(impulse: number, clamp: number): void {
    this._Velocity.AddClampedYImpulse(clamp, impulse);
  }

  public SetXVelocity(vx: number): void {
    this._Velocity.Vel.x = vx;
  }

  public SetYVelocity(vy: number): void {
    this._Velocity.Vel.y = vy;
  }

  public SetPlayerPostion(x: number, y: number): void {
    this._Position.Pos.x = x;
    this._Position.Pos.y = y;
    this._ECB.MoveToPosition(x, y);
  }

  public SetPlayerInitialPosition(x: number, y: number): void {
    this._Position.Pos.x = x;
    this._Position.Pos.y = y;
    this._ECB.SetInitialPosition(x, y);
  }

  public AddToPlayerXPosition(x: number): void {
    this._Position.Pos.x += x;
    this._ECB.MoveToPosition(this._Position.Pos.x, this._Position.Pos.y);
  }

  public AddToPlayerYPosition(y: number): void {
    this._Position.Pos.y += y;
    this._ECB.MoveToPosition(this._Position.Pos.x, this._Position.Pos.y);
  }

  public AddToPlayerPosition(x: number, y: number): void {
    const pos = this._Position.Pos;
    pos.x += x;
    pos.y += y;
    this._ECB.MoveToPosition(pos.x, pos.y);
  }

  public IsGrounded(s: Stage): boolean {
    //const grnd = this._world?.Stage?.StageVerticies?.GetGround() ?? undefined;
    const grnd = s.StageVerticies.GetGround();
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

  public GetECBVerts(): FlatVec[] {
    return this._ECB.GetVerts();
  }

  public GetPrevECBVerts(): FlatVec[] {
    return this._ECB.GetPrevVerts();
  }

  public GetCCHull(): FlatVec[] {
    return this._ECB.GetHull();
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

  public PostTickTask(): void {
    this._ECB.UpdatePreviousPosition();
  }
}
