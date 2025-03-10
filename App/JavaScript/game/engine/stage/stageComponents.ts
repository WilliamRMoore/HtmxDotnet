import { FlatVec } from '../physics/vector';

export function defaultStage() {
  const sv = new StageVerticies();
  const sl = new Ledges(sv.GetGround()[0], sv.GetGround()[1]);
  const db = new DeathBoundry(-100, 1180, -100, 2020);
  return new Stage(sv, sl, db);
}

export class Stage {
  public readonly StageVerticies: StageVerticies;
  public readonly Ledges: Ledges;
  public readonly DeathBoundry: DeathBoundry;

  constructor(sv: StageVerticies, sl: Ledges, db: DeathBoundry) {
    this.StageVerticies = sv;
    this.Ledges = sl;
    this.DeathBoundry = db;
  }
}

export class StageVerticies {
  private Verts: Array<FlatVec> = new Array<FlatVec>();
  private Ground: Array<FlatVec> = new Array<FlatVec>();
  private leftWall: Array<FlatVec> = new Array<FlatVec>();
  private RightWall: Array<FlatVec> = new Array<FlatVec>();
  private Ceiling: Array<FlatVec> = new Array<FlatVec>();

  public constructor() {
    let groundStart = new FlatVec(600, 450);
    let groundEnd = new FlatVec(900, 450);
    let rightBottom = new FlatVec(900, 500);
    let leftBottom = new FlatVec(600, 500);

    this.Verts.push(groundStart, groundEnd, rightBottom, leftBottom);

    this.Ground.push(groundStart, groundEnd);
    this.RightWall.push(groundEnd, rightBottom);
    this.Ceiling.push(rightBottom, leftBottom);
    this.leftWall.push(leftBottom, groundStart);
  }

  public GetVerts(): Array<FlatVec> {
    return this.Verts;
  }

  public GetGround(): Array<FlatVec> {
    return this.Ground;
  }

  public GetLeftWall(): Array<FlatVec> {
    return this.leftWall;
  }

  public GetRightWall(): Array<FlatVec> {
    return this.RightWall;
  }

  public GetCeiling(): Array<FlatVec> {
    return this.Ceiling;
  }
}

export class Ledges {
  private leftLedge: FlatVec[];
  private rightLedge: FlatVec[];

  constructor(
    topLeft: FlatVec,
    topRight: FlatVec,
    width: number = 50,
    height: number = 20
  ) {
    const leftLedge = [] as FlatVec[];
    const rightLedge = [] as FlatVec[];

    leftLedge.push(topLeft);
    leftLedge.push(new FlatVec(topLeft.X + width, topLeft.Y));
    leftLedge.push(new FlatVec(topLeft.X + width, topLeft.Y + height));
    leftLedge.push(new FlatVec(topLeft.X, topLeft.Y + height));

    rightLedge.push(topRight);
    rightLedge.push(new FlatVec(topRight.X, topRight.Y + height));
    rightLedge.push(new FlatVec(topRight.X - width, topRight.Y + height));
    rightLedge.push(new FlatVec(topRight.X - width, topRight.Y));

    this.leftLedge = leftLedge;
    this.rightLedge = rightLedge;
  }

  public GetLeftLedge() {
    return this.leftLedge;
  }

  public GetRightLedge() {
    return this.rightLedge;
  }
}

export class DeathBoundry {
  public readonly topBoundry: number;
  public readonly bottomBoundry: number;
  public readonly leftBoundry: number;
  public readonly rightBoundry: number;

  constructor(t: number, b: number, l: number, r: number) {
    this.topBoundry = t;
    this.bottomBoundry = b;
    this.leftBoundry = l;
    this.rightBoundry = r;
  }
}

class StageVerticiesBuilder {
  private groundVerts: Array<FlatVec> | undefined;
  private leftWallVerts: Array<FlatVec> | undefined;
  private rightWallVerts: Array<FlatVec> | undefined;
  private cielingVerts: Array<FlatVec> | undefined;
  private leftLedgeVerts: Array<FlatVec> | undefined;
  private rightLedgeVerts: Array<FlatVec> | undefined;

  public SetGroundVerts(verts: Array<FlatVec>) {
    this.groundVerts = verts;
  }

  public SetLeftWallVerts(verts: Array<FlatVec>) {
    this.leftWallVerts = verts;
  }

  public SetRightWallVerts(verts: Array<FlatVec>) {
    this.rightWallVerts = verts;
  }
}
