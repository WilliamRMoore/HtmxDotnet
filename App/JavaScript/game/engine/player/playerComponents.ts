import { FlatVec, LineSegmentIntersection } from '../physics/vector';
import { FillArrayWithFlatVec } from '../utils';

// Player Components
export class PositionComponent {
  public readonly Pos: FlatVec;

  constructor(flatVec: FlatVec | undefined = undefined) {
    if (flatVec == undefined) {
      this.Pos = new FlatVec(0, 0);
      return;
    }
    this.Pos = flatVec;
  }
}

export class VelocityComponent {
  public readonly Vel: FlatVec;

  constructor() {
    this.Vel = new FlatVec(0, 0);
  }

  public AddClampedXImpulse(clamp: number, x: number): void {
    const upperBound = Math.abs(clamp);
    const vel = this.Vel.X;

    if (Math.abs(vel) > upperBound) {
      return;
    }

    this.Vel.X = Clamp(vel + x, upperBound);
  }

  public AddClampedYImpulse(clamp: number, y: number): void {
    const upperBound = Math.abs(clamp);
    const vel = this.Vel.Y;

    if (Math.abs(vel) > clamp) {
      return;
    }

    this.Vel.Y = Clamp(vel + y, upperBound);
  }
}

function Clamp(val: number, clamp: number): number {
  return Math.min(Math.max(val, -clamp), clamp);
}

export class SpeedsComponent {
  public readonly GroundedVelocityDecay: number;
  public readonly AerialVelocityDecay: number;
  public readonly AerialSpeedInpulseLimit: number;
  public readonly MaxWalkSpeed: number;
  public readonly MaxRunSpeed: number;
  public readonly WalkSpeedMulitplier: number;
  public readonly RunSpeedMultiplier: number;
  public readonly FastFallSpeed: number;
  public readonly FallSpeed: number;
  public readonly Gravity: number;
  public readonly DashImpulse: number;
  public readonly MaxDashSpeed: number;
  // Might need a general Aerial speed limit for each character

  constructor(
    grndSpeedVelDecay: number,
    aerialVelocityDecay: number,
    aerialSpeedInpulseLimit: number,
    maxWalkSpeed: number,
    maxRunSpeed: number,
    walkSpeedMultiplier: number,
    runSpeedMultiplier: number,
    fastFallSpeed: number,
    fallSpeed: number,
    dashImpulse: number,
    maxDashSpeed: number,
    gravity: number
  ) {
    this.GroundedVelocityDecay = grndSpeedVelDecay;
    this.AerialVelocityDecay = aerialVelocityDecay;
    this.AerialSpeedInpulseLimit = aerialSpeedInpulseLimit;
    this.MaxWalkSpeed = maxWalkSpeed;
    this.MaxRunSpeed = maxRunSpeed;
    this.WalkSpeedMulitplier = walkSpeedMultiplier;
    this.RunSpeedMultiplier = runSpeedMultiplier;
    this.FastFallSpeed = fastFallSpeed;
    this.FallSpeed = fallSpeed;
    this.DashImpulse = dashImpulse;
    this.MaxDashSpeed = maxDashSpeed;
    this.Gravity = gravity;
  }
}

export class PlayerFlagsComponent {
  private FacingRight: boolean = false;
  private FastFalling: boolean = false;

  FaceRight(): void {
    this.FacingRight = true;
  }

  FaceLeft(): void {
    this.FacingRight = false;
  }

  IsFacingRight(): boolean {
    return this.FacingRight;
  }

  IsFacingLeft(): boolean {
    return !this.IsFacingRight();
  }

  FastFallOn(): void {
    this.FastFalling = true;
  }

  FastFallOff(): void {
    this.FastFalling = false;
  }

  IsFastFalling(): boolean {
    return this.FastFalling;
  }
}

export class ECBComponent {
  private SesnsorDepth: number = 0.02;
  private Position: FlatVec = new FlatVec(0, 0);
  private Height: number;
  private Width: number;
  private YOffset: number;
  private Verts = new Array<FlatVec>(4);
  private Color: string;

  constructor(height: number = 100, width: number = 100, yOffset: number = 0) {
    this.Color = 'orange';
    this.Height = height;
    this.Width = width;
    this.YOffset = yOffset;
    FillArrayWithFlatVec(this.Verts);
    this.Update();
  }

  public MoveToPosition(x: number, y: number) {
    this.Position.X = x;
    this.Position.Y = y;
    this.Update();
  }

  Update(): void {
    const px = this.Position.X;
    const py = this.Position.Y;
    const height = this.Height;
    const width = this.Width;
    const yOffset = this.YOffset;

    const bottomX = px;
    const bottomY = py + yOffset;

    const topX = px;
    const topY = bottomY - height;

    const leftX = bottomX + -(width / 2);
    const leftY = bottomY - height / 2;

    const rightX = bottomX + width / 2;
    const rightY = leftY;

    this.Verts[0].X = bottomX;
    this.Verts[0].Y = bottomY;

    this.Verts[1].X = leftX;
    this.Verts[1].Y = leftY;

    this.Verts[2].X = topX;
    this.Verts[2].Y = topY;

    this.Verts[3].X = rightX;
    this.Verts[3].Y = rightY;
  }

  public DetectGroundCollision(
    groundStart: FlatVec,
    groundEnd: FlatVec
  ): boolean {
    const bottom = this.Bottom();
    const bx = bottom.X;
    const by = bottom.Y;

    return LineSegmentIntersection(
      groundStart.X,
      groundStart.Y,
      groundEnd.X,
      groundEnd.Y,
      bx,
      by,
      bx,
      by + -this.SesnsorDepth
    );
  }

  public DetectLeftWallCollision(
    leftWallStart: FlatVec,
    leftWallEnd: FlatVec
  ): boolean {
    const left = this.Left();
    const lx = left.X;
    const ly = left.Y;

    return LineSegmentIntersection(
      leftWallStart.X,
      leftWallStart.Y,
      leftWallEnd.X,
      leftWallEnd.Y,
      lx,
      ly,
      lx + this.SesnsorDepth,
      ly
    );
  }

  public DetectCeilingCollision(
    ceilingStart: FlatVec,
    ceilingEnd: FlatVec
  ): boolean {
    const top = this.Top();
    const tx = top.X;
    const ty = top.Y;

    return LineSegmentIntersection(
      ceilingStart.X,
      ceilingStart.Y,
      ceilingEnd.X,
      ceilingEnd.Y,
      tx,
      ty,
      tx,
      ty + this.SesnsorDepth
    );
  }

  public DetectRightWallCollision(
    rightWallStart: FlatVec,
    rightWallEnd: FlatVec
  ): boolean {
    const right = this.Right();
    const rx = right.X;
    const ry = right.Y;

    return LineSegmentIntersection(
      rightWallStart.X,
      rightWallStart.Y,
      rightWallEnd.X,
      rightWallEnd.Y,
      rx,
      ry,
      rx - this.SesnsorDepth,
      ry
    );
  }

  public Bottom(): FlatVec {
    return this.Verts[0];
  }

  public Left(): FlatVec {
    return this.Verts[1];
  }

  public Top(): FlatVec {
    return this.Verts[2];
  }

  public Right(): FlatVec {
    return this.Verts[3];
  }

  public GetVerts(): Array<FlatVec> {
    return this.Verts;
  }

  public GetColor(): string {
    return this.Color;
  }

  public SetColor(color: string): void {
    this.Color = color;
  }
}

export class JumpComponent {
  public readonly JumpVelocity: number;
  private readonly NumberOfJumps: number = 2;
  private JumpCount: number = 0;

  constructor(jumpVelocity: number, numberOfJumps: number = 2) {
    this.JumpVelocity = jumpVelocity;
    this.NumberOfJumps = numberOfJumps;
  }

  HasJumps() {
    return this.JumpCount < this.NumberOfJumps;
  }

  IncrementJumps() {
    this.JumpCount++;
  }

  ResetJumps() {
    this.JumpCount = 0;
  }
}

// builder ================================================

export class SpeedsComponentBuilder {
  private GroundedVelocityDecay: number = 0;
  private AerialVelocityDecay: number = 0;
  private AerialSpeedInpulseLimit: number = 0;
  private MaxWalkSpeed: number = 0;
  private MaxRunSpeed: number = 0;
  private DashImpulse: number = 0;
  private MaxDashSpeed: number = 0;
  private WalkSpeedMulitplier: number = 0;
  private RunSpeedMultiplier: number = 0;
  private FastFallSpeed: number = 0;
  private FallSpeed: number = 0;
  private Gravity: number = 0;

  SetAerialSpeeds(
    aerialVelocityDecay: number,
    aerialSpeedImpulseLimit: number
  ) {
    this.AerialVelocityDecay = aerialVelocityDecay;
    this.AerialSpeedInpulseLimit = aerialSpeedImpulseLimit;
  }

  SetFallSpeeds(fastFallSpeed: number, fallSpeed: number, gravity: number = 1) {
    this.FallSpeed = fallSpeed;
    this.FastFallSpeed = fastFallSpeed;
    this.Gravity = gravity;
  }

  SetWalkSpeeds(maxWalkSpeed: number, walkSpeedMultiplier: number) {
    this.MaxWalkSpeed = maxWalkSpeed;
    this.WalkSpeedMulitplier = walkSpeedMultiplier;
  }

  SetRunSpeeds(maxRunSpeed: number, runSpeedMultiplier: number) {
    this.RunSpeedMultiplier = runSpeedMultiplier;
    this.MaxRunSpeed = maxRunSpeed;
  }

  SetDashSpeeds(dashImpulse: number, maxDashSpeed: number) {
    this.DashImpulse = dashImpulse;
    this.MaxDashSpeed = maxDashSpeed;
  }

  SetGroundedVelocityDecay(groundedVelocityDecay: number) {
    this.GroundedVelocityDecay = groundedVelocityDecay;
  }

  Build() {
    return new SpeedsComponent(
      this.GroundedVelocityDecay,
      this.AerialVelocityDecay,
      this.AerialSpeedInpulseLimit,
      this.MaxWalkSpeed,
      this.MaxRunSpeed,
      this.WalkSpeedMulitplier,
      this.RunSpeedMultiplier,
      this.FastFallSpeed,
      this.FallSpeed,
      this.DashImpulse,
      this.MaxDashSpeed,
      this.Gravity
    );
  }
}
