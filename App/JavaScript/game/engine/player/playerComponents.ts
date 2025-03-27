import { stateId, STATES } from '../../FSM/FiniteState';
import {
  createConvexHull,
  FlatVec,
  LineSegmentIntersection,
} from '../physics/vector';
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

export class FSMInfo {
  public StateId: number = STATES.IDLE;
}

export class VelocityComponent {
  public readonly Vel: FlatVec;

  constructor() {
    this.Vel = new FlatVec(0, 0);
  }

  public AddClampedXImpulse(clamp: number, x: number): void {
    const upperBound = Math.abs(clamp);
    const vel = this.Vel.x;

    if (Math.abs(vel) > upperBound) {
      return;
    }

    this.Vel.x = Clamp(vel + x, upperBound);
  }

  public AddClampedYImpulse(clamp: number, y: number): void {
    const upperBound = Math.abs(clamp);
    const vel = this.Vel.y;

    if (Math.abs(vel) > clamp) {
      return;
    }

    this.Vel.y = Clamp(vel + y, upperBound);
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
  private PreviousPosition: FlatVec = new FlatVec(0, 0);
  private Height: number;
  private Width: number;
  private YOffset: number;
  private CurVerts = new Array<FlatVec>(4);
  private PrevVerts = new Array<FlatVec>(4);
  private Color: string;
  private AllVerts = new Array<FlatVec>(8);
  private ccHull?: Array<FlatVec>;

  constructor(height: number = 100, width: number = 100, yOffset: number = 0) {
    this.Color = 'orange';
    this.Height = height;
    this.Width = width;
    this.YOffset = yOffset;
    FillArrayWithFlatVec(this.CurVerts);
    FillArrayWithFlatVec(this.PrevVerts);
    this.Update();
  }

  public GetHull() {
    if (this.ccHull != undefined) {
      return this.ccHull;
    }
    this.LoadAllVerts();
    return createConvexHull(this.AllVerts);
  }

  private LoadAllVerts() {
    this.AllVerts.length = 0;

    for (let i = 0; i < 4; i++) {
      this.AllVerts.push(this.PrevVerts[i]);
    }

    for (let i = 0; i < 4; i++) {
      this.AllVerts.push(this.CurVerts[i]);
    }
  }

  public UpdatePreviousPosition() {
    this.PreviousPosition.x = this.Position.x;
    this.PreviousPosition.y = this.Position.y;

    let preVert: FlatVec;
    let curVert: FlatVec;

    for (let i = 0; i < 4; i++) {
      preVert = this.PrevVerts[i];
      curVert = this.CurVerts[i];
      preVert.x = curVert.x;
      preVert.y = curVert.y;
    }
  }

  public SetInitialPosition(x: number, y: number) {
    this.MoveToPosition(x, y);
    this.UpdatePreviousPosition();
  }

  public MoveToPosition(x: number, y: number) {
    this.Position.x = x;
    this.Position.y = y;
    this.Update();
    this.ccHull = undefined;
  }

  Update(): void {
    const px = this.Position.x;
    const py = this.Position.y;
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

    this.CurVerts[0].x = bottomX;
    this.CurVerts[0].y = bottomY;

    this.CurVerts[1].x = leftX;
    this.CurVerts[1].y = leftY;

    this.CurVerts[2].x = topX;
    this.CurVerts[2].y = topY;

    this.CurVerts[3].x = rightX;
    this.CurVerts[3].y = rightY;
  }

  public DetectGroundCollision(
    groundStart: FlatVec,
    groundEnd: FlatVec
  ): boolean {
    const bottom = this.Bottom();
    const bx = bottom.x;
    const by = bottom.y;

    return LineSegmentIntersection(
      groundStart.x,
      groundStart.y,
      groundEnd.x,
      groundEnd.y,
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
    const lx = left.x;
    const ly = left.y;

    return LineSegmentIntersection(
      leftWallStart.x,
      leftWallStart.y,
      leftWallEnd.x,
      leftWallEnd.y,
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
    const tx = top.x;
    const ty = top.y;

    return LineSegmentIntersection(
      ceilingStart.x,
      ceilingStart.y,
      ceilingEnd.x,
      ceilingEnd.y,
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
    const rx = right.x;
    const ry = right.y;

    return LineSegmentIntersection(
      rightWallStart.x,
      rightWallStart.y,
      rightWallEnd.x,
      rightWallEnd.y,
      rx,
      ry,
      rx - this.SesnsorDepth,
      ry
    );
  }

  public Bottom(): FlatVec {
    return this.CurVerts[0];
  }

  public Left(): FlatVec {
    return this.CurVerts[1];
  }

  public Top(): FlatVec {
    return this.CurVerts[2];
  }

  public Right(): FlatVec {
    return this.CurVerts[3];
  }

  public GetVerts(): Array<FlatVec> {
    return this.CurVerts;
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
