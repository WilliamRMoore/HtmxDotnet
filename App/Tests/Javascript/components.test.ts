import {
  FlatVec,
  ZERO_POOL,
} from '../../JavaScript/game/engine/physics/vector';
import {
  ECBComponent,
  JumpComponent,
  PlayerFlagsComponent,
  VelocityComponent,
} from '../../JavaScript/game/engine/player/playerComponents';
import { defaultStage } from '../../JavaScript/game/engine/stage/stageComponents';

beforeEach(() => {
  ZERO_POOL();
});

// ECBComponent tests ========================================================

test('ECB Should Update Position', () => {
  const SUT = new ECBComponent();
  SUT.MoveToPosition(10, 0);

  expect(SUT.Bottom().X).toBe(10);
  expect(SUT.Bottom().Y).toBe(0);
  expect(SUT.Left().X).toBe(-40);
  expect(SUT.Left().Y).toBe(-50);
  expect(SUT.Top().X).toBe(10);
  expect(SUT.Top().Y).toBe(-100);
  expect(SUT.Right().X).toBe(60);
  expect(SUT.Right().Y).toBe(-50);
});

test('ECB Should Detect Ground Collision', () => {
  const SUT = new ECBComponent();
  SUT.MoveToPosition(100, 100.001);

  const vdtoGroundStart = new FlatVec(80, 100);
  const vdtoGroundEnd = new FlatVec(140, 100);

  const res = SUT.DetectGroundCollision(vdtoGroundStart, vdtoGroundEnd);
  //   V
  // -----  <-- Land on this

  expect(res).toBeTruthy();
});

test('ECB Should Not Detect Ground Collision', () => {
  const SUT = new ECBComponent();
  SUT.MoveToPosition(100, 99.999);

  const vdtoGroundStart = new FlatVec(80, 100);
  const vdtoGroundEnd = new FlatVec(140, 100);

  const res = SUT.DetectGroundCollision(vdtoGroundStart, vdtoGroundEnd);

  expect(res).toBeFalsy();
});

test('ECB Should Detect Ceiling Collision', () => {
  const SUT = new ECBComponent();
  SUT.MoveToPosition(100, 399.999);
  // top : 100, 299.999 is slightly higher than 300, so it should bonk head

  const vdtoCeilingStart = new FlatVec(80, 300);
  const vdtoCeilingEnd = new FlatVec(140, 300);

  const res = SUT.DetectCeilingCollision(vdtoCeilingStart, vdtoCeilingEnd);
  // ____
  // <^> <-- bonk head

  expect(res).toBeTruthy();
});

test('ECB Should Not Detect Ceiling Collision', () => {
  const SUT = new ECBComponent();
  SUT.MoveToPosition(100, 400.001);
  // top : 100, 300.001 is slightly lower than 300, so it should not bonk head

  const vdtoCeilingStart = new FlatVec(80, 300);
  const vdtoCeilingEnd = new FlatVec(140, 300);

  const res = SUT.DetectCeilingCollision(vdtoCeilingStart, vdtoCeilingEnd);

  expect(res).toBeFalsy();
});

test('ECB Should Detect Right Wall Collision', () => {
  const SUT = new ECBComponent();

  SUT.MoveToPosition(100.001, 400);
  // right : 150.001, 450

  const vdtoRightWallStart = new FlatVec(150, 300);
  const vdtoRightWallEnd = new FlatVec(150, 400);
  // _| <-- that shape

  const res = SUT.DetectRightWallCollision(
    vdtoRightWallStart,
    vdtoRightWallEnd
  );

  expect(res).toBeTruthy();
});

test('ECB Should Not Detect Right Wall Collision', () => {
  const SUT = new ECBComponent();

  SUT.MoveToPosition(99.99, 400);

  const vdtoRightWallStart = new FlatVec(150, 300);
  const vdtoRightWallEnd = new FlatVec(150, 400);

  const res = SUT.DetectRightWallCollision(
    vdtoRightWallStart,
    vdtoRightWallEnd
  );

  expect(res).toBeFalsy();
});

test('ECB Should Detect Left Wall Collision', () => {
  const SUT = new ECBComponent();

  SUT.MoveToPosition(99.99, 400);
  // left : 49..99, 350

  const vdtoLeftWallStart = new FlatVec(50, 300);
  const vdtoLeftWallEnd = new FlatVec(50, 400);
  // |_

  const res = SUT.DetectLeftWallCollision(vdtoLeftWallStart, vdtoLeftWallEnd);

  expect(res).toBeTruthy();
});

test('ECB Should Not Detect Left Wall Collision', () => {
  const SUT = new ECBComponent();

  SUT.MoveToPosition(100.001, 400);

  const vdtoLeftWallStart = new FlatVec(50, 300);
  const vdtoLeftWallEnd = new FlatVec(50, 400);

  const res = SUT.DetectLeftWallCollision(vdtoLeftWallStart, vdtoLeftWallEnd);

  expect(res).toBeFalsy();
});

test('ECB Should detect ground from stage', () => {
  const SUT = new ECBComponent();
  SUT.MoveToPosition(700, 450.001);

  const stage = defaultStage();

  const ground = stage.StageVerticies.GetGround();

  const res = SUT.DetectGroundCollision(ground[0], ground[1]);

  expect(res).toBeTruthy();
});

//END ECBComponent tests =====================================================

// JumpComponent tests =======================================================

test('JumpComponent Should increment jumps ', () => {
  const SUT = new JumpComponent(20, 2);

  // should have jumps in the begning
  expect(SUT.HasJumps()).toBeTruthy();

  SUT.IncrementJumps();

  // should still have jumps
  expect(SUT.HasJumps()).toBeTruthy();

  SUT.IncrementJumps();

  // should not have jumps
  expect(SUT.HasJumps()).toBeFalsy();

  //Do it all over again after a reset to confimr reset works.
  SUT.ResetJumps();

  expect(SUT.HasJumps()).toBeTruthy();

  SUT.IncrementJumps();

  expect(SUT.HasJumps()).toBeTruthy();

  SUT.IncrementJumps();

  expect(SUT.HasJumps()).toBeFalsy();
});

//END JumpComponent tests ====================================================

// PlayerFlagsComponent tests ================================================

test('PlayerFlagsComponent Should Set Flags', () => {
  const SUT = new PlayerFlagsComponent();

  //face right tests

  SUT.FaceRight();

  expect(SUT.IsFacingLeft()).toBeFalsy();
  expect(SUT.IsFacingRight()).toBeTruthy();

  // face left tests
  SUT.FaceLeft();

  expect(SUT.IsFacingLeft()).toBeTruthy();
  expect(SUT.IsFacingRight()).toBeFalsy();

  //ground tests
  expect(SUT.IsGrounded()).toBeFalsy();

  SUT.Ground();

  expect(SUT.IsGrounded()).toBeTruthy();

  SUT.Unground();

  expect(SUT.IsGrounded()).toBeFalsy();

  //ledge grab tests
  expect(SUT.IsInLedgeGrab()).toBeFalsy();

  SUT.GrabLedge();

  expect(SUT.IsInLedgeGrab()).toBeTruthy();

  SUT.UnGrabLedge();

  expect(SUT.IsInLedgeGrab()).toBeFalsy();

  //gravity tests
  expect(SUT.IsGravityOn()).toBeTruthy;

  SUT.TurnOffGavity();

  expect(SUT.IsGravityOn()).toBeFalsy();

  SUT.TurnOnGravity();

  expect(SUT.IsGravityOn()).toBeTruthy();
});

// END PlayerFlagsComponent tests =============================================

// VelocityComponent tests ====================================================

test('VelocityComponent Should Clamp Impulses', () => {
  const SUT = new VelocityComponent();

  // Test X impulse
  SUT.AddClampedXImpulse(10, 5);
  expect(SUT.Vel.X).toBe(5);

  // Test Y impulse
  SUT.AddClampedYImpulse(10, 5);
  expect(SUT.Vel.Y).toBe(5);

  // Add more to reach clamp
  SUT.AddClampedXImpulse(10, 7);
  SUT.AddClampedYImpulse(10, 7);

  // Should be clamped at 10
  expect(SUT.Vel.X).toBe(10);
  expect(SUT.Vel.Y).toBe(10);

  SUT.Vel.X = 100;
  SUT.Vel.Y = 100;

  expect(SUT.Vel.X).toBe(100);

  SUT.AddClampedXImpulse(10, 5);

  expect(SUT.Vel.X).toBe(100);

  SUT.Vel.Y = 0;
  SUT.Vel.X = 0;

  SUT.AddClampedYImpulse(10, -5);

  expect(SUT.Vel.Y).toBe(-5);

  SUT.AddClampedXImpulse(10, -2);

  expect(SUT.Vel.X).toBe(-2);

  SUT.Vel.X = 0;
  SUT.Vel.Y = 0;

  SUT.AddClampedXImpulse(10, 20);

  expect(SUT.Vel.X).toBe(10);
});

//END VelocityComponent tests =============================================
