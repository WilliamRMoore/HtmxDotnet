import {
  AttackDecisions,
  attackId,
  DownSpecialConditions,
  GAME_EVENTS,
  Idle,
  RunAttackCondition,
  stateId,
  STATES,
} from '../finite-state-machine/PlayerStates';
import { FSMState } from '../finite-state-machine/PlayerStateMachine';
import {
  CreateConvexHull,
  FlatVec,
  LineSegmentIntersection,
} from '../physics/vector';
import { FillArrayWithFlatVec } from '../utils';
import { Player, PlayerHelpers } from './playerOrchestrator';
import { Clamp } from '../utils';
import { Circle } from '../physics/circle';
import { InputAction } from '../../loops/Input';
import { World } from '../world/world';
import { PooledVector } from '../pools/PooledVector';
import { Pool } from '../pools/Pool';

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

export class StaticHistory {
  public ledgDetecorHeight: number = 0;
  public LedgeDetectorWidth: number = 0;
  public HurtCapsules: Array<HurtCapsule> = [];
}

export class ComponentHistory {
  public readonly StaticPlayerHistory = new StaticHistory();
  readonly PositionHistory: Array<FlatVec> = [];
  readonly FsmInfoHistory: Array<FSMInfoSnapShot> = [];
  readonly PlayerPointsHistory: Array<PlayerPointsSnapShot> = [];
  readonly PlayerHitStunHistory: Array<hitStunSnapShot> = [];
  readonly PlayerHitStopHistory: Array<hitStopSnapShot> = [];
  readonly VelocityHistory: Array<FlatVec> = [];
  readonly FlagsHistory: Array<FlagsSnapShot> = [];
  readonly EcbHistory: Array<ECBSnapShot> = [];
  //readonly HurtCirclesHistory: Array<HurtCirclesSnapShot> = [];
  readonly JumpHistroy: Array<number> = [];
  readonly LedgeDetectorHistory: Array<LedgeDetectorSnapShot> = [];
  readonly AttackHistory: Array<AttackSnapShot> = [];

  public SetPlayerToFrame(p: Player, frameNumber: number) {
    p.Postion.SetFromSnapShot(this.PositionHistory[frameNumber]);
    p.FSMInfo.SetFromSnapShot(this.FsmInfoHistory[frameNumber]);
    p.Velocity.SetFromSnapShot(this.VelocityHistory[frameNumber]);
    p.Points.SetFromSnapShot(this.PlayerPointsHistory[frameNumber]);
    p.HitStop.SetFromSnapShot(this.PlayerHitStopHistory[frameNumber]);
    p.HitStun.SetFromSnapShot(this.PlayerHitStunHistory[frameNumber]);
    //p.HitPause.SetFromSnapShot(this.PlayerHitPauseHistory[frameNumber]);
    p.Flags.SetFromSnapShot(this.FlagsHistory[frameNumber]);
    p.ECB.SetFromSnapShot(this.EcbHistory[frameNumber]);
    p.LedgeDetector.SetFromSnapShot(this.LedgeDetectorHistory[frameNumber]);
    p.Jump.SetFromSnapShot(this.JumpHistroy[frameNumber]);
    p.Attacks.SetFromSnapShot(this.AttackHistory[frameNumber]);
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

export class WeightComponent {
  public readonly Weight: number;

  constructor(weight: number) {
    this.Weight = weight;
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

export type FSMInfoSnapShot = {
  State: FSMState;
  StateFrame: number;
  frameLengths: Map<stateId, number>;
};

export class FSMInfoComponent implements IHistoryEnabled<FSMInfoSnapShot> {
  private currentState: FSMState = Idle;
  private currentStateId: stateId = STATES.IDLE_S;
  private currentStateFrame: number = 0;
  private readonly frameLengths: Map<stateId, number>;

  public constructor(frameLengths: Map<stateId, number>) {
    this.frameLengths = frameLengths;
  }

  public get CurrentStateFrame() {
    return this.currentStateFrame;
  }

  public get CurrentState(): FSMState {
    return this.currentState;
  }

  public get CurrentStatetId(): stateId {
    return this.currentStateId;
  }

  public SetCurrentState(s: FSMState) {
    this.currentState = s;
    this.currentStateId = s.StateId;
  }

  public IncrementStateFrame(): void {
    this.currentStateFrame++;
  }

  public SetStateFrameToZero(): void {
    this.currentStateFrame = 0;
  }

  public GetFrameLengthOrUndefined(stateId: stateId): number | undefined {
    return this.frameLengths.get(stateId);
  }

  public GetFrameLenthOrUndefinedForCurrentState(): number | undefined {
    return this.frameLengths.get(this.currentStateId);
  }

  public SetFrameLength(stateId: stateId, frameLength: number): void {
    this.frameLengths.set(stateId, frameLength);
  }

  public SnapShot(): FSMInfoSnapShot {
    return {
      State: this.currentState,
      StateFrame: this.currentStateFrame,
      frameLengths: new Map(this.frameLengths),
    } as FSMInfoSnapShot;
  }

  public SetFromSnapShot(snapShot: FSMInfoSnapShot): void {
    this.currentState = snapShot.State;
    this.currentStateFrame = snapShot.StateFrame;
    for (const [key, value] of snapShot.frameLengths.entries()) {
      this.frameLengths.set(key, value);
    }
  }
}

type hitStopSnapShot = number; //{ frames: number };

export class HitStopComponent implements IHistoryEnabled<hitStopSnapShot> {
  private hitStopFrames: number = 0;

  public SetHitStop(frames: number) {
    this.hitStopFrames = frames;
  }

  public Decrement() {
    this.hitStopFrames--;
  }

  public SetZero() {
    this.hitStopFrames = 0;
  }

  public get HitStopFrames(): number {
    return this.hitStopFrames;
  }

  public SnapShot(): hitStopSnapShot {
    return this.hitStopFrames as hitStopSnapShot;
  }

  public SetFromSnapShot(snapShot: hitStopSnapShot): void {
    this.hitStopFrames = snapShot;
  }
}

type hitStunSnapShot = {
  hitStunFrames: number;
  vx: number;
  vy: number;
};

export class HitStunComponent implements IHistoryEnabled<hitStunSnapShot> {
  private framesOfHitStun: number = 0;
  private xVelocity: number = 0;
  private yVelocity: number = 0;

  public set FramesOfHitStun(hitStunFrames: number) {
    this.framesOfHitStun = hitStunFrames;
  }

  public get VX(): number {
    return this.xVelocity;
  }

  public get VY(): number {
    return this.yVelocity;
  }

  public SetHitStun(hitStunFrames: number, vx: number, vy: number) {
    this.framesOfHitStun = hitStunFrames;
    this.xVelocity = vx;
    this.yVelocity = vy;
  }

  public DecrementHitStun() {
    this.framesOfHitStun--;
  }

  public Zero() {
    this.framesOfHitStun = 0;
    this.xVelocity = 0;
    this.yVelocity = 0;
  }

  public SnapShot(): hitStunSnapShot {
    return {
      hitStunFrames: this.framesOfHitStun,
      vx: this.xVelocity,
      vy: this.yVelocity,
    } as hitStunSnapShot;
  }

  public SetFromSnapShot(snapShot: hitStunSnapShot): void {
    this.framesOfHitStun = snapShot.hitStunFrames;
    this.xVelocity = snapShot.vx;
    this.yVelocity = snapShot.vy;
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

  public get Damage(): number {
    return this.damagePoints;
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

export type FlagsSnapShot = {
  FacingRight: boolean;
  FastFalling: boolean;
  Gravity: boolean;
  CanWalkOffStage: boolean;
  HitPauseFrames: number;
  IntangabilityFrames: number;
};

export class PlayerFlagsComponent implements IHistoryEnabled<FlagsSnapShot> {
  private facingRight: boolean = false;
  private fastFalling: boolean = false;
  private gravityOn: boolean = true;
  private canWalkOffStage: boolean = false;
  private hitPauseFrames: number = 0;
  private intangabilityFrames: number = 0;

  public FaceRight(): void {
    this.facingRight = true;
  }

  public FaceLeft(): void {
    this.facingRight = false;
  }

  public FastFallOn(): void {
    this.fastFalling = true;
  }

  public FastFallOff(): void {
    this.fastFalling = false;
  }

  public ChangeDirections() {
    this.facingRight = !this.facingRight;
  }

  public SetCanWalkOffTrue() {
    this.canWalkOffStage = true;
  }

  public SetCanWalkOffFalse() {
    this.canWalkOffStage = false;
  }

  public GravityOn(): void {
    this.gravityOn = true;
  }

  public GravityOff(): void {
    this.gravityOn = false;
  }

  public SetHitPauseFrames(frames: number): void {
    this.hitPauseFrames = frames;
  }

  public DecrementHitPause(): void {
    this.hitPauseFrames--;
  }

  public SetIntangabilityFrames(frames: number): void {
    this.intangabilityFrames = frames;
  }

  public DecrementIntangabilityFrames(): void {
    this.intangabilityFrames--;
  }

  public get IsFastFalling(): boolean {
    return this.fastFalling;
  }

  public get IsFacingRight(): boolean {
    return this.facingRight;
  }

  public get IsFacingLeft(): boolean {
    return !this.facingRight;
  }

  public get CanWalkOffStage(): boolean {
    return this.canWalkOffStage;
  }

  public get HasGravity(): boolean {
    return this.gravityOn;
  }

  public get IsInHitPause(): boolean {
    return this.hitPauseFrames > 0;
  }

  public get IsIntangible(): boolean {
    return this.intangabilityFrames > 0;
  }

  public SnapShot(): FlagsSnapShot {
    return {
      FacingRight: this.facingRight,
      FastFalling: this.fastFalling,
      Gravity: this.gravityOn,
      CanWalkOffStage: this.canWalkOffStage,
      HitPauseFrames: this.hitPauseFrames,
      IntangabilityFrames: this.intangabilityFrames,
    } as FlagsSnapShot;
  }

  public SetFromSnapShot(snapShot: FlagsSnapShot): void {
    this.fastFalling = snapShot.FastFalling;
    this.facingRight = snapShot.FacingRight;
    this.gravityOn = snapShot.Gravity;
    this.canWalkOffStage = snapShot.CanWalkOffStage;
    this.hitPauseFrames = snapShot.HitPauseFrames;
    this.intangabilityFrames = snapShot.IntangabilityFrames;
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

  public SetECBShape(yOffset: number, height: number, width: number): void {
    this.yOffset = yOffset;
    this.height = height;
    this.width = width;
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

  public get YOffsect(): number {
    return this.yOffset;
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

export class HurtCapsule {
  public readonly StartOffsetX: number;
  public readonly StartOffsetY: number;
  public readonly EndOffsetX: number;
  public readonly EndOffsetY: number;
  public readonly Radius: number;

  constructor(
    startOffsetX: number,
    startOffsetY: number,
    endOffsetX: number,
    endOffsetY: number,
    radius: number
  ) {
    this.StartOffsetX = startOffsetX;
    this.StartOffsetY = startOffsetY;
    this.EndOffsetX = endOffsetX;
    this.EndOffsetY = endOffsetY;
    this.Radius = radius;
  }

  public GetStartPosition(
    x: number,
    y: number,
    vecPool: Pool<PooledVector>
  ): PooledVector {
    return vecPool.Rent().SetXY(this.StartOffsetX + x, this.StartOffsetY + y);
  }

  public GetEndPosition(
    x: number,
    y: number,
    vecPool: Pool<PooledVector>
  ): PooledVector {
    return vecPool.Rent().SetXY(this.EndOffsetX + x, this.EndOffsetY + y);
  }
}

export class HurtCapsules {
  public readonly HurtCapsules: Array<HurtCapsule>;

  constructor(hurtCapsules: Array<HurtCapsule>) {
    this.HurtCapsules = hurtCapsules;
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

type bubbleId = number;
type frameNumber = number;

export class HitBubble {
  public readonly BubbleId: bubbleId;
  public readonly Damage: number;
  public readonly Priority: number;
  public readonly Radius: number;
  public readonly launchAngle: number;
  public readonly ActiveFrames: Array<frameNumber>;
  private readonly frameOffsets: Map<frameNumber, FlatVec>;

  constructor(
    id: bubbleId,
    damage: number,
    priority: number,
    radius: number,
    launchAngle: number,
    frameOffsets: Map<frameNumber, FlatVec>,
    activeFrames: Array<frameNumber>
  ) {
    this.BubbleId = id;
    this.Damage = damage;
    this.Priority = priority;
    this.Radius = radius;
    this.launchAngle = launchAngle;
    this.frameOffsets = frameOffsets;
    this.ActiveFrames = activeFrames;
  }

  public GetLocalOffSetForFrame(stateFrameNumber: number) {
    return this.frameOffsets.get(stateFrameNumber);
  }

  public GetOffSetForFrameGlobal(
    vecPool: Pool<PooledVector>,
    facingRight: boolean,
    stateFrameNumber: number,
    playerGlobalPositon: PooledVector
  ): PooledVector | undefined {
    const offSet = this.frameOffsets.get(stateFrameNumber);
    if (offSet === undefined) {
      return;
    }
    const globalX = facingRight
      ? playerGlobalPositon.X + offSet.X
      : playerGlobalPositon.X - offSet.X;
    const globalY = playerGlobalPositon.Y + offSet.Y;

    return vecPool.Rent().SetXY(globalX, globalY);
  }
}

export class Attack {
  public readonly Name: string;
  public readonly Gravity: boolean;
  public readonly TotalFrameLength: number;
  public readonly BaseKnockBack: number;
  public readonly KnockBackScaling: number;
  private hitBubbles: Map<frameNumber, Array<HitBubble>>;
  private impulses: Map<frameNumber, FlatVec>;
  public readonly ImpulseClamp: number | undefined;
  public readonly PlayerIdsHit: Array<number> = [];

  constructor(
    name: string,
    totalFrameLength: number,
    hitBubbles: Array<HitBubble>,
    baseKb: number,
    kbScaling: number,
    impulseClamp = 0,
    impulses: Map<frameNumber, FlatVec> = new Map<frameNumber, FlatVec>(),
    gravity = true
  ) {
    this.impulses = impulses;
    this.ImpulseClamp = impulseClamp;
    this.Name = name;
    this.TotalFrameLength = totalFrameLength;
    this.Gravity = gravity;
    this.BaseKnockBack = baseKb;
    this.KnockBackScaling = kbScaling;

    let attack = new Map<frameNumber, Array<HitBubble>>();
    hitBubbles.forEach((hb) => {
      const activeFrames = hb.ActiveFrames;
      for (let i = 0; i < activeFrames.length; i++) {
        const frame = activeFrames[i];
        if (attack.has(frame)) {
          attack!.get(frame)!.push(hb);
        } else {
          attack.set(frame, [hb]);
        }
      }
    });

    for (let [k, v] of attack) {
      v.sort((a, b) => a.Priority - b.Priority);
    }

    this.hitBubbles = attack;
  }

  public GetHitBubblesForFrame(
    frameNumber: number
  ): Array<HitBubble> | undefined {
    return this.hitBubbles.get(frameNumber);
  }

  public GetImpulseForFrame(frameNumber: number): FlatVec | undefined {
    return this.impulses.get(frameNumber);
  }

  public HitPlayer(playerIndex: number) {
    this.PlayerIdsHit.push(playerIndex);
  }

  public HasHitPlayer(playerIndex: number) {
    return this.PlayerIdsHit.includes(playerIndex);
  }

  public ResetPlayeIdHitArray() {
    this.PlayerIdsHit.length = 0;
    this.PlayerIdsHit[0] = -1;
  }
}

export type AttackSnapShot = Attack | undefined;
export class AttackComponment implements IHistoryEnabled<AttackSnapShot> {
  private attacks: Map<attackId, Attack>;
  private currentAttack: Attack | undefined = undefined;

  public constructor(attacks: Map<attackId, Attack>) {
    this.attacks = attacks;
  }

  public GetAttack(): Attack | undefined {
    return this.currentAttack;
  }

  public SetCurrentAttack(p: Player, w: World, ia: InputAction): void {
    const gameEventID = ia.Action;
    const grounded = PlayerHelpers.IsPlayerGroundedOnStage(p, w.Stage!);

    if (gameEventID === GAME_EVENTS.ATTACK_GE && grounded) {
      const conditionsLength = AttackDecisions.length;
      for (let i = 0; i < conditionsLength; i++) {
        const cond = AttackDecisions[i];
        const attackId = RunAttackCondition(cond, w, p.ID);
        if (attackId !== undefined) {
          this.currentAttack = this.attacks.get(attackId);
          return;
        }
      }
      //this.currentAttack = this.attacks.get(ATTACKS.NUETRAL_ATTACK);
      return;
    }

    if (gameEventID === GAME_EVENTS.DOWN_SPECIAL_GE && grounded) {
      const conditionalsLength = DownSpecialConditions.length;
      for (let i = 0; i < conditionalsLength; i++) {
        const cond = DownSpecialConditions[i];
        const attackId = RunAttackCondition(cond, w, p.ID);
        if (attackId !== undefined) {
          this.currentAttack = this.attacks.get(attackId);
          return;
        }
      }
      return;
      //this.currentAttack = this.attacks.get(ATTACKS.DOWN_SPECIAL_ATTACK);
    }
  }

  public ZeroCurrentAttack(): void {
    this.currentAttack = undefined;
  }

  public SnapShot(): Attack | undefined {
    return this.currentAttack;
  }

  public SetFromSnapShot(snapShot: Attack | undefined): void {
    this.currentAttack = snapShot;
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
