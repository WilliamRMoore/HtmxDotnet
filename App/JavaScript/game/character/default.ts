import { stateId, STATES } from '../engine/finite-state-machine/PlayerStates';
import { Circle } from '../engine/physics/circle';
import { FlatVec } from '../engine/physics/vector';
import { SpeedsComponentBuilder } from '../engine/player/playerComponents';

export type CharacterConfig = {
  FrameLengths: Map<stateId, number>;
  SCB: SpeedsComponentBuilder;
  ECBHeight: number;
  ECBWidth: number;
  ECBOffset: number;
  HurtCircles: Array<{ circle: Circle; offset: FlatVec }>;
  JumpVelocity: number;
  NumberOfJumps: number;
  LedgeBoxHeight: number;
  LedgeBoxWidth: number;
  ledgeBoxYOffset: number;
};

export class DefaultCharacterConfig {
  public FrameLengths = new Map<stateId, number>();
  public SCB: SpeedsComponentBuilder;
  public ECBHeight: number;
  public ECBWidth: number;
  public ECBOffset: number;
  public HurtCircles: Array<{ circle: Circle; offset: FlatVec }> = [];
  public JumpVelocity: number;
  public NumberOfJumps: number;
  public LedgeBoxHeight: number;
  public LedgeBoxWidth: number;
  public ledgeBoxYOffset: number;

  constructor() {
    this.FrameLengths.set(STATES.START_WALK_S, 5)
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

    this.SCB = new SpeedsComponentBuilder();
    this.SCB.SetWalkSpeeds(11, 2);
    this.SCB.SetRunSpeeds(14, 2.2);
    this.SCB.SetFallSpeeds(22, 15, 0.7);
    this.SCB.SetAerialSpeeds(0.5, 13, 1.8);
    this.SCB.SetDashSpeeds(3, 17);
    this.SCB.SetAirDodgeSpeed(25);
    this.SCB.SetGroundedVelocityDecay(0.8);

    this.ECBOffset = 0;
    this.ECBHeight = 100;
    this.ECBWidth = 100;

    this.populateHurtCircles();

    this.JumpVelocity = 18;
    this.NumberOfJumps = 2;

    this.LedgeBoxHeight = 35;
    this.LedgeBoxWidth = 80;
    this.ledgeBoxYOffset = -130;
  }

  private populateHurtCircles() {
    const body = new Circle(40);
    const head = new Circle(14);
    const bodyOffset = new FlatVec(0, -50);
    const headOffset = new FlatVec(0, -108);

    this.HurtCircles.push({ circle: body, offset: bodyOffset });
    this.HurtCircles.push({ circle: head, offset: headOffset });
  }
}
