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
  readonly positionHistory: Array<FlatVec> = [];
  readonly fsmInfoHistory: Array<FSMInfoSnapShot> = [];
  readonly velocityHistory: Array<FlatVec> = [];
  readonly flagsHistory: Array<FlagsSnapShot> = [];
  readonly ecbHistory: Array<ECBSnapShot> = [];
  readonly jumpHistroy: Array<number> = [];

  public RecordPlayer(p: Player, frameNumber: number) {
    this.positionHistory[frameNumber] = p.PostionComponent.SnapShot();
    this.fsmInfoHistory[frameNumber] = p.FSMInfoComponent.SnapShot();
    this.velocityHistory[frameNumber] = p.VelocityComponent.SnapShot();
    this.flagsHistory[frameNumber] = p.FlagsComponent.SnapShot();
    this.ecbHistory[frameNumber] = p.ECBComponent.SnapShot();
    this.jumpHistroy[frameNumber] = p.JumpComponent.SnapShot();
  }

  public SetPlayerToFrame(p: Player, frameNumber: number) {
    p.PostionComponent.SetFromSnapShot(this.positionHistory[frameNumber]);
    p.FSMInfoComponent.SetFromSnapShot(this.fsmInfoHistory[frameNumber]);
    p.VelocityComponent.SetFromSnapShot(this.velocityHistory[frameNumber]);
    p.FlagsComponent.SetFromSnapShot(this.flagsHistory[frameNumber]);
    p.ECBComponent.SetFromSnapShot(this.ecbHistory[frameNumber]);
    p.JumpComponent.SetFromSnapShot(this.jumpHistroy[frameNumber]);
  }
}

interface IHistoryEnabled<T> {
  SnapShot(): T;
  SetFromSnapShot(snapShot: T): void;
}

// Player Components
export class PositionComponent implements IHistoryEnabled<FlatVec> {
  private readonly position: FlatVec;

  constructor(flatVec: FlatVec | undefined = undefined) {
    if (flatVec == undefined) {
      this.position = new FlatVec(0, 0);
      return;
    }
    this.position = flatVec;
  }

  public GetAsFlatVec(): FlatVec {
    return this.position;
  }

  public get X() {
    return this.position.x;
  }

  public get Y() {
    return this.position.y;
  }

  public set X(val: number) {
    this.position.x = val;
  }

  public set Y(val: number) {
    this.position.y = val;
  }

  public SnapShot(): FlatVec {
    return new FlatVec(this.position.x, this.position.y);
  }

  public SetFromSnapShot(snapShot: FlatVec): void {
    this.position.x = snapShot.x;
    this.position.y = snapShot.y;
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
  private readonly velocity: FlatVec;

  constructor() {
    this.velocity = new FlatVec(0, 0);
  }

  public AddClampedXImpulse(clamp: number, x: number): void {
    const upperBound = Math.abs(clamp);
    const vel = this.velocity.x;

    if (Math.abs(vel) > upperBound) {
      return;
    }

    this.velocity.x = Clamp(vel + x, upperBound);
  }

  public AddClampedYImpulse(clamp: number, y: number): void {
    const upperBound = Math.abs(clamp);
    const vel = this.velocity.y;

    if (Math.abs(vel) > clamp) {
      return;
    }

    this.velocity.y = Clamp(vel + y, upperBound);
  }

  public SnapShot(): FlatVec {
    return new FlatVec(this.velocity.x, this.velocity.y);
  }

  public SetFromSnapShot(snapShot: FlatVec): void {
    this.velocity.x = snapShot.x;
    this.velocity.y = snapShot.y;
  }

  public GetAsFlatVec() {
    return this.velocity;
  }

  public get X(): number {
    return this.velocity.x;
  }

  public get Y(): number {
    return this.velocity.y;
  }

  public set X(val: number) {
    this.velocity.x = val;
  }

  public set Y(val: number) {
    this.velocity.y = val;
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
  private facingRight: boolean = false;
  private fastFalling: boolean = false;

  public FaceRight(): void {
    this.facingRight = true;
  }

  public FaceLeft(): void {
    this.facingRight = false;
  }

  public IsFacingRight(): boolean {
    return this.facingRight;
  }

  public IsFacingLeft(): boolean {
    return !this.IsFacingRight();
  }

  public FastFallOn(): void {
    this.fastFalling = true;
  }

  public FastFallOff(): void {
    this.fastFalling = false;
  }

  public IsFastFalling(): boolean {
    return this.fastFalling;
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
      FacingRight: this.facingRight,
      FastFalling: this.fastFalling,
    } as FlagsSnapShot;
  }

  public SetFromSnapShot(snapShot: FlagsSnapShot): void {
    this.fastFalling = snapShot.FastFalling;
    this.facingRight = snapShot.FacingRight;
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
  private readonly sesnsorDepth: number = 0.2;
  private readonly position: FlatVec = new FlatVec(0, 0);
  private readonly previousPosition: FlatVec = new FlatVec(0, 0);
  private readonly curVerts = new Array<FlatVec>(4);
  private readonly prevVerts = new Array<FlatVec>(4);
  private readonly allVerts = new Array<FlatVec>(8);

  private color: string;
  private height: number;
  private width: number;
  private yOffset: number;

  constructor(height: number = 100, width: number = 100, yOffset: number = 0) {
    this.color = 'orange';
    this.height = height;
    this.width = width;
    this.yOffset = yOffset;
    FillArrayWithFlatVec(this.curVerts);
    FillArrayWithFlatVec(this.prevVerts);
    this.Update();
  }

  public GetHull(): FlatVec[] {
    this.loadAllVerts();
    return createConvexHull(this.allVerts);
  }

  private loadAllVerts(): void {
    this.allVerts.length = 0;

    for (let i = 0; i < 4; i++) {
      this.allVerts.push(this.prevVerts[i]);
    }

    for (let i = 0; i < 4; i++) {
      this.allVerts.push(this.curVerts[i]);
    }
  }

  public UpdatePreviousECB(): void {
    this.previousPosition.x = this.position.x;
    this.previousPosition.y = this.position.y;

    const prevVert = this.prevVerts;
    const curVert = this.curVerts;
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
    this.position.x = x;
    this.position.y = y;
    this.Update();
  }

  public Update(): void {
    const px = this.position.x;
    const py = this.position.y;
    const height = this.height;
    const width = this.width;
    const yOffset = this.yOffset;

    const bottomX = px;
    const bottomY = py + yOffset;

    const topX = px;
    const topY = bottomY - height;

    const leftX = bottomX - width / 2;
    const leftY = bottomY - height / 2;

    const rightX = bottomX + width / 2;
    const rightY = leftY;

    this.curVerts[0].x = bottomX;
    this.curVerts[0].y = bottomY;

    this.curVerts[1].x = leftX;
    this.curVerts[1].y = leftY;

    this.curVerts[2].x = topX;
    this.curVerts[2].y = topY;

    this.curVerts[3].x = rightX;
    this.curVerts[3].y = rightY;
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
      by - this.sesnsorDepth
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
      by - this.sesnsorDepth
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
      lx + this.sesnsorDepth,
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
      ty + this.sesnsorDepth
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
      rx - this.sesnsorDepth,
      ry
    );
  }

  public get Bottom(): FlatVec {
    return this.curVerts[0];
  }

  public get PrevBottom(): FlatVec {
    return this.prevVerts[0];
  }

  public get Left(): FlatVec {
    return this.curVerts[1];
  }

  public get PrevLeft(): FlatVec {
    return this.prevVerts[1];
  }

  public get Top(): FlatVec {
    return this.curVerts[2];
  }

  public get PrevTop(): FlatVec {
    return this.prevVerts[2];
  }

  public get Right(): FlatVec {
    return this.curVerts[3];
  }

  public get PrevRight(): FlatVec {
    return this.prevVerts[3];
  }

  public GetColor(): string {
    return this.color;
  }

  public SetColor(color: string): void {
    this.color = color;
  }

  public SnapShot(): ECBSnapShot {
    return {
      posX: this.position.x,
      posY: this.position.y,
      prevPosX: this.previousPosition.x,
      prevPosY: this.previousPosition.y,
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
      YOffset: this.yOffset,
      Height: this.height,
      Width: this.width,
    } as ECBSnapShot;
  }

  public SetFromSnapShot(snapShot: ECBSnapShot): void {
    this.position.x = snapShot.posX;
    this.position.y = snapShot.posY;
    this.previousPosition.x = snapShot.prevPosX;
    this.previousPosition.y = snapShot.prevPosY;
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
    this.yOffset = snapShot.YOffset;
    this.height = snapShot.Height;
    this.width = snapShot.Width;
  }
}
export class JumpComponent implements IHistoryEnabled<number> {
  private readonly numberOfJumps: number = 2;
  private jumpCount: number = 0;
  public readonly JumpVelocity: number;

  constructor(jumpVelocity: number, numberOfJumps: number = 2) {
    this.JumpVelocity = jumpVelocity;
    this.numberOfJumps = numberOfJumps;
  }

  public HasJumps() {
    return this.jumpCount < this.numberOfJumps;
  }

  public IncrementJumps() {
    this.jumpCount++;
  }

  public ResetJumps() {
    this.jumpCount = 0;
  }

  public SnapShot(): number {
    return this.jumpCount;
  }

  public SetFromSnapShot(snapShot: number): void {
    this.jumpCount = snapShot;
  }
}

// builder ================================================

export class SpeedsComponentBuilder {
  private groundedVelocityDecay: number = 0;
  private aerialVelocityDecay: number = 0;
  private aerialSpeedInpulseLimit: number = 0;
  private maxWalkSpeed: number = 0;
  private maxRunSpeed: number = 0;
  private dashMutiplier: number = 0;
  private maxDashSpeed: number = 0;
  private walkSpeedMulitplier: number = 0;
  private runSpeedMultiplier: number = 0;
  private fastFallSpeed: number = 0;
  private fallSpeed: number = 0;
  private gravity: number = 0;

  SetAerialSpeeds(
    aerialVelocityDecay: number,
    aerialSpeedImpulseLimit: number
  ) {
    this.aerialVelocityDecay = aerialVelocityDecay;
    this.aerialSpeedInpulseLimit = aerialSpeedImpulseLimit;
  }

  SetFallSpeeds(fastFallSpeed: number, fallSpeed: number, gravity: number = 1) {
    this.fallSpeed = fallSpeed;
    this.fastFallSpeed = fastFallSpeed;
    this.gravity = gravity;
  }

  SetWalkSpeeds(maxWalkSpeed: number, walkSpeedMultiplier: number) {
    this.maxWalkSpeed = maxWalkSpeed;
    this.walkSpeedMulitplier = walkSpeedMultiplier;
  }

  SetRunSpeeds(maxRunSpeed: number, runSpeedMultiplier: number) {
    this.runSpeedMultiplier = runSpeedMultiplier;
    this.maxRunSpeed = maxRunSpeed;
  }

  SetDashSpeeds(dashMultiplier: number, maxDashSpeed: number) {
    this.dashMutiplier = dashMultiplier;
    this.maxDashSpeed = maxDashSpeed;
  }

  SetGroundedVelocityDecay(groundedVelocityDecay: number) {
    this.groundedVelocityDecay = groundedVelocityDecay;
  }

  Build() {
    return new SpeedsComponent(
      this.groundedVelocityDecay,
      this.aerialVelocityDecay,
      this.aerialSpeedInpulseLimit,
      this.maxWalkSpeed,
      this.maxRunSpeed,
      this.walkSpeedMulitplier,
      this.runSpeedMultiplier,
      this.fastFallSpeed,
      this.fallSpeed,
      this.dashMutiplier,
      this.maxDashSpeed,
      this.gravity
    );
  }
}
