import {
  attackId,
  ATTACKS,
  stateId,
  STATES,
} from '../engine/finite-state-machine/PlayerStates';
import { FlatVec } from '../engine/physics/vector';
import {
  Attack,
  AttackBuilder,
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
    const neutralAttack = GetNutralAttackNewAPI();
    const DownSpecial = GetDownSpecial();
    const neutralAir = GetNeutralAir();

    this.FrameLengths.set(STATES.START_WALK_S, 5)
      .set(STATES.JUMP_SQUAT_S, 5)
      .set(STATES.TURN_S, 3)
      .set(STATES.DASH_S, 20)
      .set(STATES.DASH_TURN_S, 1)
      .set(STATES.RUN_TURN_S, 20)
      .set(STATES.STOP_RUN_S, 15)
      .set(STATES.JUMP_S, 15)
      .set(STATES.AIR_DODGE_S, 22)
      .set(STATES.LAND_S, 15)
      .set(STATES.SOFT_LAND_S, 2)
      .set(STATES.ATTACK_S, neutralAttack.TotalFrameLength)
      .set(STATES.N_AIR_S, neutralAir.TotalFrameLength)
      .set(STATES.DOWN_SPECIAL_S, DownSpecial.TotalFrameLength);

    this.SCB = new SpeedsComponentBuilder();
    this.SCB.SetWalkSpeeds(6, 1.6);
    this.SCB.SetRunSpeeds(10, 2.2);
    this.SCB.SetFallSpeeds(20, 10, 0.7);
    this.SCB.SetAerialSpeeds(0.7, 9, 1.8);
    this.SCB.SetDashSpeeds(3, 13);
    this.SCB.SetAirDodgeSpeed(20);
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
      .set(ATTACKS.DOWN_SPECIAL, DownSpecial)
      .set(ATTACKS.N_AIR_ATTACK, neutralAir);
  }

  private populateHurtCircles() {
    const body = new HurtCapsule(0, -40, 0, -50, 40);
    const head = new HurtCapsule(0, -105, 0, -140, 14);
    this.HurtCapsules.push(head);
    this.HurtCapsules.push(body);
  }
}

function GetNutralAttackNewAPI() {
  const hb1OffSets = new Map<frameNumber, FlatVec>();
  const hb1Frame3Offset = new FlatVec(30, -50);
  const hb1Frame4Offset = new FlatVec(60, -50);
  const hb1Frame5Offset = new FlatVec(80, -50);
  const hb1Frame6Offset = new FlatVec(80, -50);
  const hb1Frame7Offset = new FlatVec(80, -50);

  hb1OffSets
    .set(3, hb1Frame3Offset)
    .set(4, hb1Frame4Offset)
    .set(5, hb1Frame5Offset)
    .set(6, hb1Frame6Offset)
    .set(7, hb1Frame7Offset);

  const hb2OffSets = new Map<frameNumber, FlatVec>();
  const hb2Frame3Offset = new FlatVec(15, -50);
  const hb2Frame4Offset = new FlatVec(25, -50);
  const hb2Frame5Offset = new FlatVec(55, -50);
  const hb2Frame6Offset = new FlatVec(65, -50);
  const hb2Frame7Offset = new FlatVec(65, -50);

  hb2OffSets
    .set(3, hb2Frame3Offset)
    .set(4, hb2Frame4Offset)
    .set(5, hb2Frame5Offset)
    .set(6, hb2Frame6Offset)
    .set(7, hb2Frame7Offset);

  const bldr = new AttackBuilder('ThunderPalm');

  bldr
    .WithBaseKnockBack(15)
    .WithKnockBackScaling(54)
    .WithGravity(true)
    .WithTotalFrames(18)
    .WithInteruptableFrame(15)
    .WithHitBubble(7, 16, 0, 60, hb1OffSets)
    .WithHitBubble(6, 14, 1, 60, hb2OffSets);

  return bldr.Build();
}

function GetNeutralAir() {
  const activeFrames = 40;
  const hb1OffSets = new Map<frameNumber, FlatVec>();
  hb1OffSets
    .set(6, new FlatVec(80, -50))
    .set(7, new FlatVec(85, -50))
    .set(8, new FlatVec(90, -50))
    .set(9, new FlatVec(90, -50));

  const hb2OffSets = new Map<frameNumber, FlatVec>()
    .set(6, new FlatVec(35, -50))
    .set(7, new FlatVec(40, -50))
    .set(8, new FlatVec(45, -50))
    .set(9, new FlatVec(47, -50));

  const hb3offSets = new Map<frameNumber, FlatVec>()
    .set(6, new FlatVec(10, -50))
    .set(7, new FlatVec(10, -50))
    .set(8, new FlatVec(10, -50))
    .set(9, new FlatVec(10, -50));

  const hb4offsets = new Map<frameNumber, FlatVec>()
    .set(19, new FlatVec(80, -50))
    .set(20, new FlatVec(85, -50))
    .set(21, new FlatVec(90, -50));

  const hb5Offsets = new Map<frameNumber, FlatVec>()
    .set(19, new FlatVec(35, -50))
    .set(20, new FlatVec(40, -50))
    .set(21, new FlatVec(45, -50));

  const hb6Offsets = new Map<frameNumber, FlatVec>()
    .set(19, new FlatVec(10, -50))
    .set(20, new FlatVec(10, -50))
    .set(21, new FlatVec(10, -50))
    .set(22, new FlatVec(10, -50));

  const bldr = new AttackBuilder('NeutralAir')
    .WithBaseKnockBack(59)
    .WithKnockBackScaling(60)
    .WithGravity(true)
    .WithTotalFrames(activeFrames)
    .WithHitBubble(12, 20, 0, 25, hb1OffSets)
    .WithHitBubble(11, 19, 1, 25, hb2OffSets)
    .WithHitBubble(13, 23, 3, 35, hb3offSets)
    .WithHitBubble(15, 20, 4, 25, hb4offsets)
    .WithHitBubble(12, 20, 5, 25, hb5Offsets)
    .WithHitBubble(13, 23, 6, 35, hb6Offsets);

  return bldr.Build();
}

function GetDownSpecial() {
  const activeFrames = 77;
  const impulses = new Map<frameNumber, FlatVec>();
  const hb1OffSets = new Map<frameNumber, FlatVec>();
  const hb2OffSets = new Map<frameNumber, FlatVec>();
  const hb3offSets = new Map<frameNumber, FlatVec>();
  const hb4OffSets = new Map<frameNumber, FlatVec>();

  for (let i = 0; i < activeFrames; i++) {
    hb1OffSets.set(i, new FlatVec(100, -25));
    hb2OffSets.set(i, new FlatVec(70, -25));
    hb3offSets.set(i, new FlatVec(40, -25));
    if (i > 50) {
      hb4OffSets.set(i, new FlatVec(120, -25));
    }
    impulses.set(i, new FlatVec(3, 0));
  }

  const blrd = new AttackBuilder('WizardsRod');

  blrd
    .WithBaseKnockBack(15)
    .WithKnockBackScaling(66)
    .WithGravity(false)
    .WithTotalFrames(activeFrames)
    .WithHitBubble(15, 20, 0, 45, hb1OffSets)
    .WithHitBubble(13, 19, 1, 45, hb2OffSets)
    .WithHitBubble(12, 18, 3, 45, hb3offSets)
    .WithHitBubble(16, 25, 4, 45, hb4OffSets)
    .WithImpulses(impulses, 15);

  return blrd.Build();
}
