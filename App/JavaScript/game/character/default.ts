import {
  attackId,
  ATTACKS,
  stateId,
  STATES,
} from '../engine/finite-state-machine/PlayerStates';
import { Circle } from '../engine/physics/circle';
import { FlatVec } from '../engine/physics/vector';
import {
  Attack,
  HitBubble,
  SpeedsComponentBuilder,
} from '../engine/player/playerComponents';

type frameNumber = number;

const hb1OffSets = new Map<frameNumber, FlatVec>();
const hb1ActiveFrame = [3, 4, 5, 6, 7];
const hb1Frame3Offset = new FlatVec(30, -50);
const hb1Frame4Offset = new FlatVec(40, -50);
const hb1Frame5Offset = new FlatVec(70, -50);
const hb1Frame6Offset = new FlatVec(70, -50);
const hb1Frame7Offset = new FlatVec(70, -50);

hb1OffSets.set(3, hb1Frame3Offset);
hb1OffSets.set(4, hb1Frame4Offset);
hb1OffSets.set(5, hb1Frame5Offset);
hb1OffSets.set(6, hb1Frame6Offset);
hb1OffSets.set(7, hb1Frame7Offset);

const hb2ActiveFrame = [3, 4, 5, 6, 7];
const hb2OffSets = new Map<frameNumber, FlatVec>();
const hb2Frame3Offset = new FlatVec(15, -50);
const hb2Frame4Offset = new FlatVec(25, -50);
const hb2Frame5Offset = new FlatVec(55, -50);
const hb2Frame6Offset = new FlatVec(55, -50);
const hb2Frame7Offset = new FlatVec(55, -50);

hb2OffSets.set(3, hb2Frame3Offset);
hb2OffSets.set(4, hb2Frame4Offset);
hb2OffSets.set(5, hb2Frame5Offset);
hb2OffSets.set(6, hb2Frame6Offset);
hb2OffSets.set(7, hb2Frame7Offset);

const defaultNeutralAttackHitBubble1 = new HitBubble(
  0,
  7,
  0,
  10,
  hb1OffSets,
  hb1ActiveFrame
);
const defaultNeutralAttackHitBubble2 = new HitBubble(
  1,
  6,
  1,
  8,
  hb2OffSets,
  hb2ActiveFrame
);

const hbs = [defaultNeutralAttackHitBubble1, defaultNeutralAttackHitBubble2];

const DefaultNeutralAttack = new Attack('ThunderPalm', hbs);

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
  attacks: Map<attackId, Attack>;
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
  public attacks: Map<attackId, Attack> = new Map<attackId, Attack>();

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
    this.attacks.set(ATTACKS.NUETRAL_ATTACK, DefaultNeutralAttack);
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
