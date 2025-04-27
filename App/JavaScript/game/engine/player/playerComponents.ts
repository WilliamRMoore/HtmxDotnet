import { Idle, stateId, STATES } from '../finite-state-machine/PlayerStates';
import { FSMState } from '../finite-state-machine/PlayerStateMachine';
import {
  CreateConvexHull,
  FlatVec,
  LineSegmentIntersection,
} from '../physics/vector';
import { FillArrayWithFlatVec } from '../utils';
import { Player } from './playerOrchestrator';
import { Clamp } from '../utils';
import { Circle } from '../physics/circle';

/**
 * This file contains everything pertaining to player components.
 *
 * Player Componenets: Components are the building blocks for game features.
 * Entities (Player, in this case) are componesed of components like these.
 *
 * Guide Line:
 * 1. Components should not contain other components.
 * 2. Components should not reference state outside of themselves.
 * 3. Components should be atomic and behave similar to primitives.
 * 4. Components should try to make as much state private as possible.
 *
 * ComponentHistory:
 * ComponentHistory is used to get a snap shot of each components state once per frame.
 * Every component that is stateful and mutative needs to implement the IHistoryEnabled Interface.
 * This is necessary for rollback.
 */

class StaticHistory {
  public ledgDetecorHeight: number = 0;
  public LedgeDetectorWidth: number = 0;
}

export class ComponentHistory {
  public readonly StaticPlayerHistory = new StaticHistory();
  readonly PositionHistory: Array<FlatVec> = [];
  readonly FsmInfoHistory: Array<FSMInfoSnapShot> = [];
  readonly PlayerPointsHistory: Array<PlayerPointsSnapShot> = [];
  readonly VelocityHistory: Array<FlatVec> = [];
  readonly FlagsHistory: Array<FlagsSnapShot> = [];
  readonly FrameLengthHistory: Array<StateFrameLengthsSnapShot> = [];
  readonly EcbHistory: Array<ECBSnapShot> = [];
  readonly HurtCirclesHistory: Array<HurtCirclesSnapShot> = [];
  readonly JumpHistroy: Array<number> = [];
  readonly LedgeDetectorHistory: Array<LedgeDetectorSnapShot> = [];

  public SetPlayerToFrame(p: Player, frameNumber: number) {
    p.Postion.SetFromSnapShot(this.PositionHistory[frameNumber]);
    p.FSMInfo.SetFromSnapShot(this.FsmInfoHistory[frameNumber]);
    p;
    p.Velocity.SetFromSnapShot(this.VelocityHistory[frameNumber]);
    p.Flags.SetFromSnapShot(this.FlagsHistory[frameNumber]);
    p.StateFrameLengths.SetFromSnapShot(this.FrameLengthHistory[frameNumber]);
    p.ECB.SetFromSnapShot(this.EcbHistory[frameNumber]);
    p.HurtCircles.SetFromSnapShot(this.HurtCirclesHistory[frameNumber]);
    p.LedgeDetector.SetFromSnapShot(this.LedgeDetectorHistory[frameNumber]);
    p.Jump.SetFromSnapShot(this.JumpHistroy[frameNumber]);
  }

  public static GetRightXFromEcbHistory(ecb: ECBSnapShot) {
    return ecb.posX + ecb.Width / 2;
  }

  public static GetRightYFromEcbHistory(ecb: ECBSnapShot) {
    return ecb.posY - ecb.Height / 2;
  }

  public static GetLeftXFromEcbHistory(ecb: ECBSnapShot) {
    return ecb.posX - ecb.Width / 2;
  }

  public static GetLeftYFromEcbHistory(ecb: ECBSnapShot) {
    return ecb.posY - ecb.Height / 2;
  }

  public static GetTopXFromEcbHistory(ecb: ECBSnapShot) {
    return ecb.posX;
  }

  public static GetTopYFromEcbHistory(ecb: ECBSnapShot) {
    return ecb.posY - ecb.Height;
  }

  public static GetBottomXFromEcbHistory(ecb: ECBSnapShot) {
    return ecb.posX;
  }

  public static GetBottomYFromEcbHistory(ecb: ECBSnapShot) {
    return ecb.posY;
  }

  public static GetPrevRightXFromEcbHistory(ecb: ECBSnapShot) {
    return ecb.prevPosX + ecb.Width / 2;
  }

  public static GetPrevRightYFromEcbHistory(ecb: ECBSnapShot) {
    return ecb.prevPosY - ecb.Height / 2;
  }

  public static GetPrevLeftXFromEcbHistory(ecb: ECBSnapShot) {
    return ecb.prevPosX - ecb.Width / 2;
  }

  public static GetPrevLeftYFromEcbHistory(ecb: ECBSnapShot) {
    return ecb.prevPosY - ecb.Height / 2;
  }

  public static GetPrevTopXFromEcbHistory(ecb: ECBSnapShot) {
    return ecb.prevPosX;
  }

  public static GetPrevTopYFromEcbHistory(ecb: ECBSnapShot) {
    return ecb.prevPosY - ecb.Height;
  }

  public static GetPrevBottomXFromEcbHistory(ecb: ECBSnapShot) {
    return ecb.prevPosX;
  }

  public static GetPrevBottomYFromEcbHistory(ecb: ECBSnapShot) {
    return ecb.prevPosY;
  }
}

interface IHistoryEnabled<T> {
  SnapShot(): T;
  SetFromSnapShot(snapShot: T): void;
}

// Player Components
export class PositionComponent implements IHistoryEnabled<FlatVec> {
  private x: number;
  private y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  public get X() {
    return this.x;
  }

  public get Y() {
    return this.y;
  }

  public set X(val: number) {
    this.x = val;
  }

  public set Y(val: number) {
    this.y = val;
  }

  public SnapShot(): FlatVec {
    return new FlatVec(this.x, this.y);
  }

  public SetFromSnapShot(snapShot: FlatVec): void {
    this.x = snapShot.X;
    this.y = snapShot.Y;
  }
}

export class VelocityComponent implements IHistoryEnabled<FlatVec> {
  private x: number;
  private y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  public AddClampedXImpulse(clamp: number, x: number): void {
    const upperBound = Math.abs(clamp);
    const vel = this.x;

    if (Math.abs(vel) > upperBound) {
      return;
    }

    this.x = Clamp(vel + x, upperBound);
  }

  public AddClampedYImpulse(clamp: number, y: number): void {
    const upperBound = Math.abs(clamp);
    const vel = this.y;

    if (Math.abs(vel) > clamp) {
      return;
    }

    this.y = Clamp(vel + y, upperBound);
  }

  public SnapShot(): FlatVec {
    return new FlatVec(this.x, this.y);
  }

  public SetFromSnapShot(snapShot: FlatVec): void {
    this.x = snapShot.X;
    this.y = snapShot.Y;
  }

  public get X(): number {
    return this.x;
  }

  public get Y(): number {
    return this.y;
  }

  public set X(val: number) {
    this.x = val;
  }

  public set Y(val: number) {
    this.y = val;
  }
}

export type StateFrameLengthsSnapShot = {
  frameLengths: Map<stateId, number>;
};

export class StateFrameLengthsComponent
  implements IHistoryEnabled<StateFrameLengthsSnapShot>
{
  private readonly frameLengths = new Map<stateId, number>();

  constructor() {
    this.frameLengths
      .set(STATES.START_WALK_S, 5)
      .set(STATES.JUMP_SQUAT_S, 5)
      .set(STATES.TURN_S, 3)
      .set(STATES.DASH_S, 20)
      .set(STATES.DASH_TURN_S, 1)
      .set(STATES.RUN_TURN_S, 20)
      .set(STATES.STOP_RUN_S, 15)
      .set(STATES.JUMP_S, 15)
      .set(STATES.AIR_DODGE_S, 25)
      .set(STATES.LAND_S, 5)
      .set(STATES.SOFT_LAND_S, 1);
  }

  public GetFrameLengthOrUndefined(stateId: stateId): number | undefined {
    return this.frameLengths.get(stateId);
  }

  public SnapShot(): StateFrameLengthsSnapShot {
    return {
      frameLengths: new Map(this.frameLengths),
    } as StateFrameLengthsSnapShot;
  }

  public SetFromSnapShot(snapShot: StateFrameLengthsSnapShot): void {
    for (const [key, value] of snapShot.frameLengths.entries()) {
      this.frameLengths.set(key, value);
    }
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
  public readonly AirDogeSpeed: number;
  public readonly ArielVelocityMultiplier: number;
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
    aerialVelocityMultiplier: number,
    airDodgeSpeed: number,
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
    this.ArielVelocityMultiplier = aerialVelocityMultiplier;
    this.AirDogeSpeed = airDodgeSpeed;
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

type PlayerPointsSnapShot = {
  damagePoints: number;
  matchPoints: number;
};

export class PlayerPointsComponent
  implements IHistoryEnabled<PlayerPointsSnapShot>
{
  private damagePoints: number = 0;
  private matchPoints: number = 0;
  private defaultMatchPoints: number;

  public constructor(defaultMatchPoints: number = 4) {
    this.defaultMatchPoints = defaultMatchPoints;
  }

  public AddDamage(number: number): void {
    this.damagePoints += number;
  }

  public SubtrackDamage(number: number): void {
    this.damagePoints -= number;
  }

  public addMatchPoints(number: number): void {
    this.matchPoints += number;
  }

  public SubtractMatchPoints(number: number): void {
    this.matchPoints -= number;
  }

  public ResetMatchPoints(): void {
    this.matchPoints = this.defaultMatchPoints;
  }

  public ResetDamagePoints(): void {
    this.damagePoints = 0;
  }

  public SnapShot(): PlayerPointsSnapShot {
    return {
      damagePoints: this.damagePoints,
      matchPoints: this.matchPoints,
    } as PlayerPointsSnapShot;
  }

  public SetFromSnapShot(snapShot: PlayerPointsSnapShot): void {
    this.damagePoints = snapShot.damagePoints;
    this.matchPoints = snapShot.matchPoints;
  }
}

type timedFlag = {
  frameLength: number;
  frameNumber: number;
};

export type FlagsSnapShot = {
  FacingRight: boolean;
  FastFalling: boolean;
  IntangibleFrameLength: number;
  IntangibleFrameNumber: number;
};

export class PlayerFlagsComponent implements IHistoryEnabled<FlagsSnapShot> {
  private facingRight: boolean = false;
  private fastFalling: boolean = false;
  private intangible: timedFlag = { frameLength: 0, frameNumber: 0 };

  public SetIntangible(frameLength: number) {
    this.intangible.frameLength = frameLength;
    this.intangible.frameNumber = 0;
  }

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
    return !this.facingRight;
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

  public IsIntangible(): boolean {
    return this.intangible.frameLength > this.intangible.frameNumber;
  }

  public ChangeDirections() {
    this.facingRight = !this.facingRight;
  }

  public UpdateTimedFlags(): void {
    this.intangible.frameNumber++;
  }

  public SnapShot(): FlagsSnapShot {
    return {
      FacingRight: this.facingRight,
      FastFalling: this.fastFalling,
      IntangibleFrameLength: this.intangible.frameLength,
      IntangibleFrameNumber: this.intangible.frameNumber,
    } as FlagsSnapShot;
  }

  public SetFromSnapShot(snapShot: FlagsSnapShot): void {
    this.fastFalling = snapShot.FastFalling;
    this.facingRight = snapShot.FacingRight;
    this.intangible.frameLength = snapShot.IntangibleFrameLength;
    this.intangible.frameNumber = snapShot.IntangibleFrameNumber;
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
  private x: number = 0;
  private y: number = 0;
  private prevX: number = 0;
  private prevY: number = 0;
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
    return CreateConvexHull(this.allVerts);
  }

  public GetActiveVerts(): FlatVec[] {
    return this.curVerts;
  }

  public UpdatePreviousECB(): void {
    this.prevX = this.x;
    this.prevY = this.y;

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
    this.x = x;
    this.y = y;
    this.update();
  }

  private update(): void {
    const px = this.x;
    const py = this.y;
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
      posX: this.x,
      posY: this.y,
      prevPosX: this.prevX,
      prevPosY: this.prevY,
      YOffset: this.yOffset,
      Height: this.height,
      Width: this.width,
    } as ECBSnapShot;
  }

  public SetFromSnapShot(snapShot: ECBSnapShot): void {
    this.x = snapShot.posX;
    this.y = snapShot.posY;
    this.prevX = snapShot.prevPosX;
    this.prevY = snapShot.prevPosY;
    this.yOffset = snapShot.YOffset;
    this.height = snapShot.Height;
    this.width = snapShot.Width;

    this.update();

    // Update prevVerts

    const px = this.prevX;
    const py = this.prevY;
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

  private loadAllVerts(): void {
    this.allVerts.length = 0;

    for (let i = 0; i < 4; i++) {
      this.allVerts.push(this.prevVerts[i]);
    }

    for (let i = 0; i < 4; i++) {
      this.allVerts.push(this.curVerts[i]);
    }
  }
}

export type HurtCirclesSnapShot = {
  position: FlatVec;
  circls: Array<Circle>;
};

export class HurtCircles implements IHistoryEnabled<HurtCirclesSnapShot> {
  private offSets: Array<FlatVec> = [];
  private circles: Array<Circle> = [];
  private x: number = 0;
  private y: number = 0;

  constructor() {
    const body = new Circle(40);
    const head = new Circle(14);
    const bodyOffset = new FlatVec(0, -50);
    const headOffset = new FlatVec(0, -108);
    this.circles.push(body);
    this.circles.push(head);
    this.offSets.push(bodyOffset);
    this.offSets.push(headOffset);
  }

  private update(): void {
    const circlesLength = this.circles.length;

    for (let i = 0; i < circlesLength; i++) {
      const circ = this.circles[i];
      const offSet = this.offSets[i];
      circ.SetXY(this.x + offSet.X, this.y + offSet.Y);
    }
  }

  public MoveTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.update();
  }

  SnapShot(): HurtCirclesSnapShot {
    const pos = new FlatVec(this.x, this.y);
    const arr = new Array<Circle>();
    const circlesLength = this.circles.length;

    for (let i = 0; i < circlesLength; i++) {
      const compCirc = this.circles[i];
      const histCirc = new Circle(compCirc.Radius);
      histCirc.SetXY(compCirc.X, compCirc.Y);
      arr.push(histCirc);
    }

    return { position: pos, circls: arr } as HurtCirclesSnapShot;
  }

  SetFromSnapShot(snapShot: HurtCirclesSnapShot): void {
    this.x = snapShot.position.X;
    this.y = snapShot.position.Y;
    this.update();
  }
}

export type LedgeDetectorSnapShot = {
  middleX: number;
  middleY: number;
};

export class LedgeDetectorComponent
  implements IHistoryEnabled<LedgeDetectorSnapShot>
{
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

  public get Width(): number {
    return this.width;
  }

  public get Height(): number {
    return this.height;
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

    //bottom left
    rightBottomLeft.X = this.x;
    rightBottomLeft.Y = this.y + this.height;
    //top left
    rightTopLeft.X = this.x;
    rightTopLeft.Y = this.y;
    // top right
    rightTopRight.X = this.x + this.width;
    rightTopRight.Y = this.y;
    // bottom right
    rightBottomRight.X = this.x + this.width;
    rightBottomRight.Y = this.y + this.height;

    //bottom left
    leftBottomLeft.X = this.x - this.width;
    leftBottomLeft.Y = this.y + this.height;
    // top left
    leftTopLeft.X = this.x - this.width;
    leftTopLeft.Y = this.y;
    // top right
    leftTopRight.X = this.x;
    leftTopRight.Y = this.y;
    // bottom right
    leftBottomRight.X = this.x;
    leftBottomRight.Y = this.y + this.height;
  }

  public SnapShot(): LedgeDetectorSnapShot {
    return {
      middleX: this.x,
      middleY: this.y,
    } as LedgeDetectorSnapShot;
  }
  public SetFromSnapShot(snapShot: LedgeDetectorSnapShot): void {
    this.MoveTo(snapShot.middleX, snapShot.middleY);
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
  private aerialSpeedMultiplier: number = 0;
  private airDodgeSpeed: number = 0;
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
    aerialSpeedImpulseLimit: number,
    aerialSpeedMultiplier: number
  ) {
    this.aerialVelocityDecay = aerialVelocityDecay;
    this.aerialSpeedInpulseLimit = aerialSpeedImpulseLimit;
    this.aerialSpeedMultiplier = aerialSpeedMultiplier;
  }

  SetAirDodgeSpeed(airDodgeSpeed: number): void {
    this.airDodgeSpeed = airDodgeSpeed;
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
      this.aerialSpeedMultiplier,
      this.airDodgeSpeed,
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
