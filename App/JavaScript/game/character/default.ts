import {
  attackId,
  ATTACKS,
  stateId,
  STATES,
} from '../engine/finite-state-machine/PlayerStates';
import { FlatVec } from '../engine/physics/vector';
import {
  Attack,
  HitBubble,
  HurtCapsule,
  SpeedsComponentBuilder,
} from '../engine/player/playerComponents';

type frameNumber = number;

export type CharacterConfig = {
  FrameLengths: Map<stateId, number>;
  SCB: SpeedsComponentBuilder;
  ECBHeight: number;
  ECBWidth: number;
  ECBOffset: number;
  HurtCapsules: Array<HurtCapsule>;
  JumpVelocity: number;
  NumberOfJumps: number;
  LedgeBoxHeight: number;
  LedgeBoxWidth: number;
  ledgeBoxYOffset: number;
  attacks: Map<attackId, Attack>;
  Weight: number;
};

export class DefaultCharacterConfig {
  public FrameLengths = new Map<stateId, number>();
  public SCB: SpeedsComponentBuilder;
  public ECBHeight: number;
  public ECBWidth: number;
  public ECBOffset: number;
  public HurtCapsules: Array<HurtCapsule> = [];
  public JumpVelocity: number;
  public NumberOfJumps: number;
  public LedgeBoxHeight: number;
  public LedgeBoxWidth: number;
  public ledgeBoxYOffset: number;
  public attacks: Map<attackId, Attack> = new Map<attackId, Attack>();
  public Weight: number;

  constructor() {
    const neutralAttack = GetNeutralAttack();
    const DownSpecial = GetDownSpecial();

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
      .set(STATES.SOFT_LAND_S, 1)
      .set(STATES.ATTACK_S, neutralAttack.TotalFrameLength)
      .set(STATES.DOWN_SPECIAL_S, DownSpecial.TotalFrameLength);

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

    this.Weight = 110;

    this.JumpVelocity = 18;
    this.NumberOfJumps = 2;

    this.LedgeBoxHeight = 35;
    this.LedgeBoxWidth = 80;
    this.ledgeBoxYOffset = -130;
    this.attacks
      .set(ATTACKS.NUETRAL_ATTACK, neutralAttack)
      .set(ATTACKS.DOWN_SPECIAL_ATTACK, DownSpecial);
  }

  private populateHurtCircles() {
    const body = new HurtCapsule(0, -40, 0, -50, 40);
    const head = new HurtCapsule(0, -105, 0, -140, 14);
    this.HurtCapsules.push(head);
    this.HurtCapsules.push(body);
  }
}

// total frame 100
function GetDownSpecial(): Attack {
  //length 35
  const activeFrames = [
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
    34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52,
    53, 54, 55, 56, 57, 58, 59, 60,
  ];
  const impulses = new Map<frameNumber, FlatVec>();
  const hb1OffSets = new Map<frameNumber, FlatVec>();
  const hb2OffSets = new Map<frameNumber, FlatVec>();
  const hb3offSets = new Map<frameNumber, FlatVec>();
  const hb4OffSets = new Map<frameNumber, FlatVec>();

  activeFrames.forEach((fr) => {
    hb1OffSets.set(fr, new FlatVec(100, -25));
    hb2OffSets.set(fr, new FlatVec(70, -25));
    hb3offSets.set(fr, new FlatVec(40, -25));
    if (fr > 50) {
      hb4OffSets.set(fr, new FlatVec(120, -25));
    }
    impulses.set(fr, new FlatVec(3, 0));
  });

  const downSpecialHitBox1 = new HitBubble(
    0,
    15,
    0,
    20,
    45,
    hb1OffSets,
    activeFrames
  );

  const downSpecialHitBox2 = new HitBubble(
    1,
    13,
    1,
    19,
    45,
    hb2OffSets,
    activeFrames
  );

  const downSpecialHitBox3 = new HitBubble(
    2,
    12,
    2,
    18,
    45,
    hb3offSets,
    activeFrames
  );

  const downSpecialHitBox4 = new HitBubble(
    3,
    16,
    3,
    25,
    45,
    hb4OffSets,
    activeFrames
  );

  const hitBubles = [
    downSpecialHitBox1,
    downSpecialHitBox2,
    downSpecialHitBox3,
    downSpecialHitBox4,
  ];

  return new Attack('WizardsRod', 77, hitBubles, 15, 81, 13, impulses, false);
}

function GetNeutralAttack() {
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
    14,
    60,
    hb1OffSets,
    hb1ActiveFrame
  );
  const defaultNeutralAttackHitBubble2 = new HitBubble(
    1,
    6,
    1,
    12,
    60,
    hb2OffSets,
    hb2ActiveFrame
  );

  const hbs = [defaultNeutralAttackHitBubble1, defaultNeutralAttackHitBubble2];

  const DefaultNeutralAttack = new Attack('ThunderPalm', 18, hbs, 30, 100);

  return DefaultNeutralAttack;
}
