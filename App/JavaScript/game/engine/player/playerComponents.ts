import { Idle } from '../finite-state-machine/PlayerStates';
import { FSMState } from '../finite-state-machine/PlayerStateMachine';
import {
  createConvexHull,
  FlatVec,
  LineSegmentIntersection,
} from '../physics/vector';
import { FillArrayWithFlatVec } from '../utils';
import { Player } from './playerOrchestrator';

export class ComponentHistory {
  readonly PositionHistory: Array<FlatVec> = [];
  readonly FSMInfoHistory: Array<FSMInfoSnapShot> = [];
  readonly VelocityHistory: Array<FlatVec> = [];
  readonly FlagsHistory: Array<FlagsSnapShot> = [];
  readonly ECBHistory: Array<ECBSnapShot> = [];
  readonly JumpHistroy: Array<number> = [];

  public RecordPlayer(p: Player, frameNumber: number) {
    this.PositionHistory[frameNumber] = p.PostionComponent.SnapShot();
    this.FSMInfoHistory[frameNumber] = p.FSMInfoComponent.SnapShot();
    this.VelocityHistory[frameNumber] = p.VelocityComponent.SnapShot();
    this.FlagsHistory[frameNumber] = p.FlagsComponent.SnapShot();
    this.ECBHistory[frameNumber] = p.ECBComponent.SnapShot();
    this.JumpHistroy[frameNumber] = p.JumpComponent.SnapShot();
  }

  public SetPlayerToFrame(p: Player, frameNumber: number) {
    p.PostionComponent.SetFromSnapShot(this.PositionHistory[frameNumber]);
    p.FSMInfoComponent.SetFromSnapShot(this.FSMInfoHistory[frameNumber]);
    p.VelocityComponent.SetFromSnapShot(this.VelocityHistory[frameNumber]);
    p.FlagsComponent.SetFromSnapShot(this.FlagsHistory[frameNumber]);
    p.ECBComponent.SetFromSnapShot(this.ECBHistory[frameNumber]);
    p.JumpComponent.SetFromSnapShot(this.JumpHistroy[frameNumber]);
  }
}

interface IHistoryEnabled<T> {
  SnapShot(): T;
  SetFromSnapShot(snapShot: T): void;
}

// Player Components
export class PositionComponent implements IHistoryEnabled<FlatVec> {
  private readonly pos: FlatVec;

  constructor(flatVec: FlatVec | undefined = undefined) {
    if (flatVec == undefined) {
      this.pos = new FlatVec(0, 0);
      return;
    }
    this.pos = flatVec;
  }

  public GetAsFlatVec(): FlatVec {
    return this.pos;
  }

  public get x() {
    return this.pos.x;
  }

  public get y() {
    return this.pos.y;
  }

  public set x(val: number) {
    this.pos.x = val;
  }

  public set y(val: number) {
    this.pos.y = val;
  }

  public SnapShot(): FlatVec {
    return new FlatVec(this.pos.x, this.pos.y);
  }

  public SetFromSnapShot(snapShot: FlatVec): void {
    this.pos.x = snapShot.x;
    this.pos.y = snapShot.y;
  }
}

export type FSMInfoSnapShot = {
  State: FSMState;
  StateFrame: number;
};

export class FSMInfoComponent implements IHistoryEnabled<FSMInfoSnapShot> {
  private currentState: FSMState = Idle;
  private currentStateFrame: number = 0;

  public get CurrentStateFrame() {
    return this.currentStateFrame;
  }

  public get CurrentState(): FSMState {
    return this.currentState;
  }

  public SetCurrentState(s: FSMState) {
    this.currentState = s;
  }

  public IncrementStateFrame(): void {
    this.currentStateFrame++;
  }

  public SetStateFrameToZero(): void {
    this.currentStateFrame = 0;
  }

  public SnapShot(): FSMInfoSnapShot {
    return {
      State: this.currentState,
      StateFrame: this.currentStateFrame,
    } as FSMInfoSnapShot;
  }

  public SetFromSnapShot(snapShot: FSMInfoSnapShot): void {
    this.currentState = snapShot.State;
    this.currentStateFrame = snapShot.StateFrame;
  }
}

export class VelocityComponent implements IHistoryEnabled<FlatVec> {
  private readonly Vel: FlatVec;

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

  public SnapShot(): FlatVec {
    return new FlatVec(this.Vel.x, this.Vel.y);
  }

  public SetFromSnapShot(snapShot: FlatVec): void {
    this.Vel.x = snapShot.x;
    this.Vel.y = snapShot.y;
  }

  public GetAsFlatVec() {
    return this.Vel;
  }

  public get x() {
    return this.Vel.x;
  }

  public get y() {
    return this.Vel.y;
  }

  public set x(val: number) {
    this.Vel.x = val;
  }

  public set y(val: number) {
    this.Vel.y = val;
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
  public readonly DashMultiplier: number;
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
    dashMultiplier: number,
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
    this.DashMultiplier = dashMultiplier;
    this.MaxDashSpeed = maxDashSpeed;
    this.Gravity = gravity;
  }
}

export type FlagsSnapShot = {
  FacingRight: boolean;
  FastFalling: boolean;
};

export class PlayerFlagsComponent implements IHistoryEnabled<FlagsSnapShot> {
  private FacingRight: boolean = false;
  private FastFalling: boolean = false;

  public FaceRight(): void {
    this.FacingRight = true;
  }

  public FaceLeft(): void {
    this.FacingRight = false;
  }

  public IsFacingRight(): boolean {
    return this.FacingRight;
  }

  public IsFacingLeft(): boolean {
    return !this.IsFacingRight();
  }

  public FastFallOn(): void {
    this.FastFalling = true;
  }

  public FastFallOff(): void {
    this.FastFalling = false;
  }

  public IsFastFalling(): boolean {
    return this.FastFalling;
  }

  public ChangeDirections() {
    if (this.IsFacingRight()) {
      this.FaceLeft();
      return;
    }
    this.FaceRight();
  }

  public SnapShot(): FlagsSnapShot {
    return {
      FacingRight: this.FacingRight,
      FastFalling: this.FastFalling,
    } as FlagsSnapShot;
  }

  public SetFromSnapShot(snapShot: FlagsSnapShot): void {
    this.FastFalling = snapShot.FastFalling;
    this.FacingRight = snapShot.FacingRight;
  }
}

export type ECBSnapShot = {
  posX: number;
  posY: number;
  prevPosX: number;
  prevPosY: number;
  topX: number;
  topY: number;
  rightX: number;
  rightY: number;
  bottomX: number;
  bottomY: number;
  leftX: number;
  leftY: number;
  prevTopX: number;
  prevTopY: number;
  prevRightX: number;
  prevRightY: number;
  prevBottomX: number;
  prevBottomY: number;
  prevLeftX: number;
  preLeftY: number;
  YOffset: number;
  Height: number;
  Width: number;
};
export class ECBComponent implements IHistoryEnabled<ECBSnapShot> {
  private readonly SesnsorDepth: number = 0.2;
  private readonly Position: FlatVec = new FlatVec(0, 0);
  private readonly PreviousPosition: FlatVec = new FlatVec(0, 0);
  private readonly CurVerts = new Array<FlatVec>(4);
  private readonly PrevVerts = new Array<FlatVec>(4);
  private readonly AllVerts = new Array<FlatVec>(8);

  private Color: string;
  private Height: number;
  private Width: number;
  private YOffset: number;

  constructor(height: number = 100, width: number = 100, yOffset: number = 0) {
    this.Color = 'orange';
    this.Height = height;
    this.Width = width;
    this.YOffset = yOffset;
    FillArrayWithFlatVec(this.CurVerts);
    FillArrayWithFlatVec(this.PrevVerts);
    this.Update();
  }

  public GetHull(): FlatVec[] {
    this.LoadAllVerts();
    return createConvexHull(this.AllVerts);
  }

  private LoadAllVerts(): void {
    this.AllVerts.length = 0;

    for (let i = 0; i < 4; i++) {
      this.AllVerts.push(this.PrevVerts[i]);
    }

    for (let i = 0; i < 4; i++) {
      this.AllVerts.push(this.CurVerts[i]);
    }
  }

  public UpdatePreviousECB(): void {
    this.PreviousPosition.x = this.Position.x;
    this.PreviousPosition.y = this.Position.y;

    const prevVert = this.PrevVerts;
    const curVert = this.CurVerts;
    prevVert[0].x = curVert[0].x;
    prevVert[0].y = curVert[0].y;
    prevVert[1].x = curVert[1].x;
    prevVert[1].y = curVert[1].y;
    prevVert[2].x = curVert[2].x;
    prevVert[2].y = curVert[2].y;
    prevVert[3].x = curVert[3].x;
    prevVert[3].y = curVert[3].y;
  }

  public SetInitialPosition(x: number, y: number): void {
    this.MoveToPosition(x, y);
    this.UpdatePreviousECB();
  }

  public MoveToPosition(x: number, y: number): void {
    this.Position.x = x;
    this.Position.y = y;
    this.Update();
  }

  public Update(): void {
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

  public DetectPreviousGroundCollision(
    groundStart: FlatVec,
    groundEnd: FlatVec
  ): boolean {
    const bottom = this.PrevBottom;
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

  public DetectGroundCollision(
    groundStart: FlatVec,
    groundEnd: FlatVec
  ): boolean {
    const bottom = this.Bottom;
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
    const left = this.Left;
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
    const top = this.Top;
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
    const right = this.Right;
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

  public get Bottom(): FlatVec {
    return this.CurVerts[0];
  }

  public get PrevBottom(): FlatVec {
    return this.PrevVerts[0];
  }

  public get Left(): FlatVec {
    return this.CurVerts[1];
  }

  public get PrevLeft(): FlatVec {
    return this.PrevVerts[1];
  }

  public get Top(): FlatVec {
    return this.CurVerts[2];
  }

  public get PrevTop(): FlatVec {
    return this.PrevVerts[2];
  }

  public get Right(): FlatVec {
    return this.CurVerts[3];
  }

  public get PrevRight(): FlatVec {
    return this.PrevVerts[3];
  }

  public GetVerts(): Array<FlatVec> {
    return this.CurVerts;
  }

  public GetPrevVerts(): Array<FlatVec> {
    return this.PrevVerts;
  }

  public GetColor(): string {
    return this.Color;
  }

  public SetColor(color: string): void {
    this.Color = color;
  }

  public SnapShot(): ECBSnapShot {
    return {
      posX: this.Position.x,
      posY: this.Position.y,
      prevPosX: this.PreviousPosition.x,
      prevPosY: this.PreviousPosition.y,
      topX: this.Top.x,
      topY: this.Top.y,
      rightX: this.Right.x,
      rightY: this.Right.y,
      bottomX: this.Bottom.x,
      bottomY: this.Bottom.y,
      leftX: this.Left.x,
      leftY: this.Left.y,
      prevTopX: this.PrevTop.x,
      prevTopY: this.PrevTop.y,
      prevRightX: this.PrevRight.x,
      prevRightY: this.PrevRight.y,
      prevBottomX: this.PrevBottom.x,
      prevBottomY: this.PrevBottom.y,
      prevLeftX: this.PrevLeft.x,
      preLeftY: this.PrevLeft.y,
      YOffset: this.YOffset,
      Height: this.Height,
      Width: this.Width,
    } as ECBSnapShot;
  }

  public SetFromSnapShot(snapShot: ECBSnapShot): void {
    this.Position.x = snapShot.posX;
    this.Position.y = snapShot.posY;
    this.PreviousPosition.x = snapShot.prevPosX;
    this.PreviousPosition.y = snapShot.prevPosY;
    this.Top.x = snapShot.topX;
    this.Top.y = snapShot.topY;
    this.Right.x = snapShot.rightX;
    this.Right.y = snapShot.rightY;
    this.Bottom.x = snapShot.bottomX;
    this.Bottom.y = snapShot.bottomY;
    this.Left.x = snapShot.leftX;
    this.Left.y = snapShot.leftY;
    this.PrevTop.x = snapShot.prevTopX;
    this.PrevTop.y = snapShot.prevTopY;
    this.PrevRight.x = snapShot.prevRightX;
    this.PrevRight.y = snapShot.prevRightY;
    this.PrevBottom.x = snapShot.prevBottomX;
    this.PrevBottom.y = snapShot.prevBottomY;
    this.PrevLeft.x = snapShot.prevLeftX;
    this.PrevLeft.y = snapShot.preLeftY;
    this.YOffset = snapShot.YOffset;
    this.Height = snapShot.Height;
    this.Width = snapShot.Width;
  }
}
export class JumpComponent implements IHistoryEnabled<number> {
  public readonly JumpVelocity: number;
  private readonly NumberOfJumps: number = 2;
  private JumpCount: number = 0;

  constructor(jumpVelocity: number, numberOfJumps: number = 2) {
    this.JumpVelocity = jumpVelocity;
    this.NumberOfJumps = numberOfJumps;
  }

  public HasJumps() {
    return this.JumpCount < this.NumberOfJumps;
  }

  public IncrementJumps() {
    this.JumpCount++;
  }

  public ResetJumps() {
    this.JumpCount = 0;
  }

  public SnapShot(): number {
    return this.JumpCount;
  }

  public SetFromSnapShot(snapShot: number): void {
    this.JumpCount = snapShot;
  }
}

// builder ================================================

export class SpeedsComponentBuilder {
  private GroundedVelocityDecay: number = 0;
  private AerialVelocityDecay: number = 0;
  private AerialSpeedInpulseLimit: number = 0;
  private MaxWalkSpeed: number = 0;
  private MaxRunSpeed: number = 0;
  private DashMutiplier: number = 0;
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

  SetDashSpeeds(dashMultiplier: number, maxDashSpeed: number) {
    this.DashMutiplier = dashMultiplier;
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
      this.DashMutiplier,
      this.MaxDashSpeed,
      this.Gravity
    );
  }
}
