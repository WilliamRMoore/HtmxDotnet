import { Idle } from '../finite-state-machine/PlayerStates';
import { FSMState } from '../finite-state-machine/PlayerStateMachine';
import {
  createConvexHull,
  FlatVec,
  LineSegmentIntersection,
} from '../physics/vector';
import { FillArrayWithFlatVec } from '../utils';
import { Player } from './playerOrchestrator';
import { Clamp } from '../utils';

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
    return this.position.X;
  }

  public get Y() {
    return this.position.Y;
  }

  public set X(val: number) {
    this.position.X = val;
  }

  public set Y(val: number) {
    this.position.Y = val;
  }

  public SnapShot(): FlatVec {
    return new FlatVec(this.position.X, this.position.Y);
  }

  public SetFromSnapShot(snapShot: FlatVec): void {
    this.position.X = snapShot.X;
    this.position.Y = snapShot.Y;
  }
}

export class VelocityComponent implements IHistoryEnabled<FlatVec> {
  private readonly velocity: FlatVec;

  constructor() {
    this.velocity = new FlatVec(0, 0);
  }

  public AddClampedXImpulse(clamp: number, x: number): void {
    const upperBound = Math.abs(clamp);
    const vel = this.velocity.X;

    if (Math.abs(vel) > upperBound) {
      return;
    }

    this.velocity.X = Clamp(vel + x, upperBound);
  }

  public AddClampedYImpulse(clamp: number, y: number): void {
    const upperBound = Math.abs(clamp);
    const vel = this.velocity.Y;

    if (Math.abs(vel) > clamp) {
      return;
    }

    this.velocity.Y = Clamp(vel + y, upperBound);
  }

  public SnapShot(): FlatVec {
    return new FlatVec(this.velocity.X, this.velocity.Y);
  }

  public SetFromSnapShot(snapShot: FlatVec): void {
    this.velocity.X = snapShot.X;
    this.velocity.Y = snapShot.Y;
  }

  public GetAsFlatVec() {
    return this.velocity;
  }

  public get X(): number {
    return this.velocity.X;
  }

  public get Y(): number {
    return this.velocity.Y;
  }

  public set X(val: number) {
    this.velocity.X = val;
  }

  public set Y(val: number) {
    this.velocity.Y = val;
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
    this.loadAllVerts();
    this.update();
  }

  public GetHull(): FlatVec[] {
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
    this.previousPosition.X = this.position.X;
    this.previousPosition.Y = this.position.Y;

    const prevVert = this.prevVerts;
    const curVert = this.curVerts;
    prevVert[0].X = curVert[0].X;
    prevVert[0].Y = curVert[0].Y;
    prevVert[1].X = curVert[1].X;
    prevVert[1].Y = curVert[1].Y;
    prevVert[2].X = curVert[2].X;
    prevVert[2].Y = curVert[2].Y;
    prevVert[3].X = curVert[3].X;
    prevVert[3].Y = curVert[3].Y;
  }

  public SetInitialPosition(x: number, y: number): void {
    this.MoveToPosition(x, y);
    this.UpdatePreviousECB();
  }

  public MoveToPosition(x: number, y: number): void {
    this.position.X = x;
    this.position.Y = y;
    this.update();
  }

  private areVertsClose(
    prevVerts: FlatVec[],
    curVerts: FlatVec[],
    threshold: number
  ): boolean {
    for (let i = 0; i < prevVerts.length; i++) {
      const prev = prevVerts[i];
      const cur = curVerts[i];
      const dx = prev.X - cur.X;
      const dy = prev.Y - cur.Y;

      // Check if the distance between the points exceeds the threshold
      if (Math.sqrt(dx * dx + dy * dy) > threshold) {
        return false;
      }
    }
    return true;
  }

  private update(): void {
    const px = this.position.X;
    const py = this.position.Y;
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

    this.curVerts[0].X = bottomX;
    this.curVerts[0].Y = bottomY;

    this.curVerts[1].X = leftX;
    this.curVerts[1].Y = leftY;

    this.curVerts[2].X = topX;
    this.curVerts[2].Y = topY;

    this.curVerts[3].X = rightX;
    this.curVerts[3].Y = rightY;
  }

  public DetectPreviousGroundCollision(
    groundStart: FlatVec,
    groundEnd: FlatVec
  ): boolean {
    const bottom = this.PrevBottom;
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
      by - this.sesnsorDepth
    );
  }

  public DetectGroundCollision(
    groundStart: FlatVec,
    groundEnd: FlatVec
  ): boolean {
    const bottom = this.Bottom;
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
      by - this.sesnsorDepth
    );
  }

  public DetectLeftWallCollision(
    leftWallStart: FlatVec,
    leftWallEnd: FlatVec
  ): boolean {
    const left = this.Left;
    const lx = left.X;
    const ly = left.Y;

    return LineSegmentIntersection(
      leftWallStart.X,
      leftWallStart.Y,
      leftWallEnd.X,
      leftWallEnd.Y,
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
      ty + this.sesnsorDepth
    );
  }

  public DetectRightWallCollision(
    rightWallStart: FlatVec,
    rightWallEnd: FlatVec
  ): boolean {
    const right = this.Right;
    const rx = right.X;
    const ry = right.Y;

    return LineSegmentIntersection(
      rightWallStart.X,
      rightWallStart.Y,
      rightWallEnd.X,
      rightWallEnd.Y,
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
      posX: this.position.X,
      posY: this.position.Y,
      prevPosX: this.previousPosition.X,
      prevPosY: this.previousPosition.Y,
      YOffset: this.yOffset,
      Height: this.height,
      Width: this.width,
    } as ECBSnapShot;
  }

  public SetFromSnapShot(snapShot: ECBSnapShot): void {
    this.position.X = snapShot.posX;
    this.position.Y = snapShot.posY;
    this.previousPosition.X = snapShot.prevPosX;
    this.previousPosition.Y = snapShot.prevPosY;
    this.yOffset = snapShot.YOffset;
    this.height = snapShot.Height;
    this.width = snapShot.Width;

    this.update();

    // Update prevVerts

    const px = this.previousPosition.X;
    const py = this.previousPosition.Y;
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

    this.prevVerts[0].X = bottomX;
    this.prevVerts[0].Y = bottomY;

    this.prevVerts[1].X = leftX;
    this.prevVerts[1].Y = leftY;

    this.prevVerts[2].X = topX;
    this.prevVerts[2].Y = topY;

    this.prevVerts[3].X = rightX;
    this.prevVerts[3].Y = rightY;
  }
}

export class LedgeDetectorComponent implements IHistoryEnabled<FlatVec> {
  private yOffset: number;
  private x: number = 0;
  private y: number = 0;
  private width: number;
  private height: number;
  private rightSide: Array<FlatVec> = new Array<FlatVec>(4);
  private leftSide: Array<FlatVec> = new Array<FlatVec>(4);

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    yOffset = -130
  ) {
    this.height = height;
    this.width = width;
    this.yOffset = yOffset;
    FillArrayWithFlatVec(this.rightSide);
    FillArrayWithFlatVec(this.leftSide);
    this.MoveTo(x, y);
  }

  public MoveTo(x: number, y: number): void {
    this.x = x;
    this.y = y + this.yOffset;
    this.update();
  }

  public get LeftSide(): Array<FlatVec> {
    return this.leftSide;
  }

  public get RightSide(): Array<FlatVec> {
    return this.rightSide;
  }

  public GetFrontDetector(IsFacingRight: boolean) {
    if (IsFacingRight) {
      return this.rightSide;
    }

    return this.leftSide;
  }

  private update(): void {
    const rightBottomLeft = this.rightSide[0];
    const rightTopLeft = this.rightSide[1];
    const rightTopRight = this.rightSide[2];
    const rightBottomRight = this.rightSide[3];

    const leftBottomLeft = this.leftSide[0];
    const leftTopLeft = this.leftSide[1];
    const leftTopRight = this.leftSide[2];
    const leftBottomRight = this.leftSide[3];

    //bottm left
    rightBottomLeft.X = this.x;
    rightBottomLeft.Y = this.y;
    //top left
    rightTopLeft.X = this.x;
    rightTopLeft.Y = this.y + this.height;
    // top right
    rightTopRight.X = this.x + this.width;
    rightTopRight.Y = this.y + this.height;
    // bottom right
    rightBottomRight.X = this.x + this.width;
    rightBottomRight.Y = this.y;

    //bottom left
    leftBottomLeft.X = this.x - this.width;
    leftBottomLeft.Y = this.y;
    // top left
    leftTopLeft.X = this.x - this.width;
    leftTopLeft.Y = this.y + this.height;
    // top right
    leftTopRight.X = this.x;
    leftTopRight.Y = this.y + this.height;
    // bottom right
    leftBottomRight.X = this.x;
    leftBottomRight.Y = this.y;
  }

  public SnapShot(): FlatVec {
    return new FlatVec(this.x, this.y);
  }
  public SetFromSnapShot(snapShot: FlatVec): void {
    this.MoveTo(snapShot.X, snapShot.Y);
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
