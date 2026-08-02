import { fx, fxi, type Fx } from '../core/fixed';
import { GROUND, PROP } from './art';

export interface MapDef {
  id: number;
  key: string;
  name: string;
  blurb: string;
  w: number;
  h: number;
  ground: number;
  groundAlt: number;
  road: number;
  /** Stroke colour used to outline the edge of the lane. */
  roadEdge: string;
  /** Waypoint chains in cell coordinates. Entries may start off-grid. */
  lanes: readonly (readonly [number, number])[][];
  core: readonly [number, number];
  /** Cells that can never hold a tower (scenery). */
  blocked: readonly (readonly [number, number])[];
  /** Authored tower foundations. Player towers may only be built here. */
  buildSites: readonly (readonly [number, number])[];
  propTiles: readonly number[];
}

export const MAPS: readonly MapDef[] = [
  {
    id: 0,
    key: 'troy-shore',
    name: 'The Shores of Troy',
    blurb: 'The long voyage home begins as raiders pursue the departing Achaeans.',
    w: 14,
    h: 20,
    ground: GROUND.grass,
    groundAlt: GROUND.grassAlt,
    // A dirt track on grass: maximum contrast, so the lane is unmistakable.
    road: GROUND.dirt,
    roadEdge: 'rgba(90,55,20,0.55)',
    lanes: [[[2, -1], [2, 4], [6, 4], [6, 8], [10, 8], [10, 12], [3, 12], [3, 16], [7, 16], [7, 18]]],
    core: [7, 18],
    blocked: [[0, 8], [1, 8], [12, 12], [13, 12], [0, 17], [13, 6], [5, 17], [9, 17]],
    buildSites: [[4,2],[9,3],[3,6],[8,6],[12,9],[7,11],[1,14],[6,14],[10,15]],
    propTiles: [PROP.tree, PROP.bushLarge, PROP.bushSmall, PROP.spikePlant],
  },
  {
    id: 1,
    key: 'cyclops-isle',
    name: 'Island of the Cyclopes',
    blurb: 'Defend the hidden cove while giants descend from the volcanic hills.',
    w: 14,
    h: 20,
    ground: GROUND.sand,
    groundAlt: GROUND.sandAlt,
    road: GROUND.stone,
    roadEdge: 'rgba(45,65,80,0.55)',
    lanes: [
      [[7, -1], [7, 3], [2, 3], [2, 7], [11, 7], [11, 11], [3, 11], [3, 15], [7, 15], [7, 18]],
    ],
    core: [7, 18],
    blocked: [[0, 1], [13, 1], [0, 13], [13, 16], [12, 17], [1, 17], [6, 0], [8, 0]],
    buildSites: [[4,1],[10,2],[4,5],[8,5],[1,9],[6,9],[12,10],[6,13],[10,14]],
    propTiles: [PROP.rockLarge, PROP.rockMed, PROP.rockSmall, PROP.spikePlant],
  },
  {
    id: 2,
    key: 'scylla-charybdis',
    name: 'Scylla and Charybdis',
    blurb: 'Two deadly straits converge on the fleet. Neither route can be ignored.',
    w: 14,
    h: 20,
    ground: GROUND.stone,
    groundAlt: GROUND.stoneAlt,
    road: GROUND.sand,
    roadEdge: 'rgba(120,100,60,0.55)',
    lanes: [
      [[-1, 3], [4, 3], [4, 8], [1, 8], [1, 13], [7, 13], [7, 18]],
      [[14, 3], [9, 3], [9, 8], [12, 8], [12, 13], [7, 13], [7, 18]],
    ],
    core: [7, 18],
    blocked: [[6, 5], [7, 5], [6, 6], [7, 6], [0, 18], [13, 18], [2, 0], [11, 0]],
    buildSites: [[2,2],[7,2],[11,4],[2,6],[7,9],[11,11],[4,12],[9,15],[5,16]],
    propTiles: [PROP.rockMed, PROP.rockLarge, PROP.bushSmall, PROP.leaf],
  },
  {
    id: 3,
    key: 'gates-of-hades',
    name: 'The Gates of Hades',
    blurb: 'Descend through the black gates where Cerberus and the Gorgon guard the road home.',
    w: 14, h: 20,
    ground: GROUND.stone, groundAlt: GROUND.stoneAlt,
    road: GROUND.dirt, roadEdge: 'rgba(120,45,35,0.62)',
    lanes: [[[1,-1],[1,4],[11,4],[11,8],[4,8],[4,12],[10,12],[10,16],[7,16],[7,18]]],
    core: [7,18],
    blocked: [[0,7],[13,7],[1,15],[12,15],[6,1],[7,1],[8,1]],
    buildSites: [[4,2],[9,2],[2,6],[7,6],[12,6],[2,10],[7,10],[12,14],[5,15]],
    propTiles: [PROP.rockLarge, PROP.rockMed, PROP.spikePlant, PROP.leaf],
  },
  {
    id: 4,
    key: 'bronze-crete',
    name: 'The Bronze Isle of Crete',
    blurb: 'Talos circles the blazing shore while Typhon stirs beneath the mountain.',
    w: 14, h: 20,
    ground: GROUND.sand, groundAlt: GROUND.sandAlt,
    road: GROUND.stone, roadEdge: 'rgba(115,70,30,0.62)',
    lanes: [[[12,-1],[12,3],[3,3],[3,7],[10,7],[10,11],[2,11],[2,15],[7,15],[7,18]]],
    core: [7,18],
    blocked: [[0,2],[13,6],[0,13],[13,16],[6,0],[7,0]],
    buildSites: [[8,1],[1,4],[7,5],[12,5],[5,9],[12,9],[5,13],[10,14],[4,17]],
    propTiles: [PROP.rockLarge, PROP.rockSmall, PROP.spikePlant, PROP.bushSmall],
  },
  {
    id: 5,
    key: 'storm-of-ithaca',
    name: 'The Storm Before Ithaca',
    blurb: 'The final sea splits around the Siren Queen and a many-armed primordial giant.',
    w: 14, h: 20,
    ground: GROUND.grass, groundAlt: GROUND.grassAlt,
    road: GROUND.sand, roadEdge: 'rgba(45,70,105,0.62)',
    lanes: [
      [[-1,2],[5,2],[5,7],[1,7],[1,12],[6,12],[6,16],[7,16],[7,18]],
      [[14,2],[9,2],[9,7],[12,7],[12,12],[8,12],[8,16],[7,16],[7,18]],
    ],
    core: [7,18],
    blocked: [[6,4],[7,4],[0,16],[13,16],[3,0],[10,0]],
    buildSites: [[2,1],[7,1],[11,3],[3,5],[7,9],[11,10],[4,11],[10,14],[4,16]],
    propTiles: [PROP.tree, PROP.bushLarge, PROP.rockMed, PROP.leaf],
  },
];

export function getMap(id: number): MapDef {
  return MAPS[id] ?? MAPS[0];
}

// ------------------------------------------------------------------ derived

export interface LanePath {
  /** Waypoints in fixed-point world units (cell centres). */
  pts: { x: Fx; y: Fx }[];
  /** Cumulative distance at each waypoint. */
  cum: Fx[];
  total: Fx;
}

export interface MapRuntime {
  def: MapDef;
  lanes: LanePath[];
  /** `true` where a lane runs - not buildable. */
  pathCells: boolean[];
  /** `true` where scenery blocks building. */
  blockedCells: boolean[];
  coreX: Fx;
  coreY: Fx;
  /** Longest lane length, used to normalise "how far along" comparisons. */
  maxLaneLen: Fx;
}

const runtimeCache = new Map<number, MapRuntime>();

/** Cell centre in world units. */
export function cellCenter(c: number): Fx {
  return fxi(c) + (1 << 15);
}

export function buildMapRuntime(id: number): MapRuntime {
  const cached = runtimeCache.get(id);
  if (cached) return cached;

  const def = getMap(id);
  const pathCells = new Array<boolean>(def.w * def.h).fill(false);
  const blockedCells = new Array<boolean>(def.w * def.h).fill(false);

  const lanes: LanePath[] = def.lanes.map((wps) => {
    const pts = wps.map(([cx, cy]) => ({ x: cellCenter(cx), y: cellCenter(cy) }));
    const cum: Fx[] = [0];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      // Lanes are axis-aligned by construction, so |dx| + |dy| is exact.
      total += Math.abs(dx) + Math.abs(dy);
      cum.push(total);
    }
    return { pts, cum, total };
  });

  // Rasterise every lane segment onto the grid so we know what is un-buildable.
  for (const wps of def.lanes) {
    for (let i = 1; i < wps.length; i++) {
      const [ax, ay] = wps[i - 1];
      const [bx, by] = wps[i];
      const stepX = Math.sign(bx - ax);
      const stepY = Math.sign(by - ay);
      let x = ax;
      let y = ay;
      markCell(pathCells, def, x, y);
      while (x !== bx || y !== by) {
        if (x !== bx) x += stepX;
        else if (y !== by) y += stepY;
        markCell(pathCells, def, x, y);
      }
    }
  }

  // Widen the un-buildable strip by nothing (towers may hug the road) but do
  // keep the core tile itself reserved.
  for (const [bx, by] of def.blocked) markCell(blockedCells, def, bx, by);
  markCell(blockedCells, def, def.core[0], def.core[1]);
  markCell(blockedCells, def, def.core[0] - 1, def.core[1]);
  markCell(blockedCells, def, def.core[0] + 1, def.core[1]);

  const rt: MapRuntime = {
    def,
    lanes,
    pathCells,
    blockedCells,
    coreX: cellCenter(def.core[0]),
    coreY: cellCenter(def.core[1]),
    maxLaneLen: lanes.reduce((m, l) => Math.max(m, l.total), 0),
  };
  runtimeCache.set(id, rt);
  return rt;
}

function markCell(arr: boolean[], def: MapDef, x: number, y: number): void {
  if (x < 0 || y < 0 || x >= def.w || y >= def.h) return;
  arr[y * def.w + x] = true;
}

export function isBuildable(rt: MapRuntime, cx: number, cy: number): boolean {
  const { w, h } = rt.def;
  if (cx < 0 || cy < 0 || cx >= w || cy >= h) return false;
  const i = cy * w + cx;
  return !rt.pathCells[i] && !rt.blockedCells[i];
}

export function isBuildSite(rt: MapRuntime, cx: number, cy: number): boolean {
  return rt.def.buildSites.some(([x, y]) => x === cx && y === cy);
}

/** Spawn point for a lane, pulled one cell further off-screen. */
export function laneSpawn(rt: MapRuntime, lane: number): { x: Fx; y: Fx } {
  const l = rt.lanes[lane % rt.lanes.length];
  return { x: l.pts[0].x, y: l.pts[0].y };
}

/** Straight-line flight distance for flyers, used for "first" targeting. */
export const FLYER_LANE_LEN: Fx = fx(24);
