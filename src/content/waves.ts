import { deriveSeed, nextInt, shuffle, type RngHolder } from '../core/rng';
import { sec, type SpawnOrder } from '../sim/types';
import { ENEMY } from './enemies';

export const WaveMod = {
  None: 0,
  Hasted: 1,
  Armoured: 2,
  Shielded: 3,
  Swarm: 4,
  Regenerating: 5,
} as const;

export const WAVE_MOD_INFO: readonly { name: string; desc: string; icon: string }[] = [
  { name: '', desc: '', icon: '' },
  { name: 'Hasted', desc: 'Enemies move 30% faster.', icon: '💨' },
  { name: 'Armoured', desc: 'Enemies gain +5 armour and 10% more health.', icon: '🛡' },
  { name: 'Shielded', desc: 'Enemies arrive with a regenerating barrier.', icon: '🔷' },
  { name: 'Swarm', desc: 'Twice as many enemies, each with 30% less health.', icon: '🐜' },
  { name: 'Regenerating', desc: 'Enemies heal 1.5% of their health every second.', icon: '💚' },
];

interface PoolEntry {
  defId: number;
  cost: number;
  minWave: number;
  /** Larger = more likely to be picked. */
  weight: number;
  /** Spawned in tight bunches of this size. */
  clump: number;
}

const POOL: readonly PoolEntry[] = [
  { defId: ENEMY.Ghoul, cost: 10, minWave: 1, weight: 10, clump: 4 },
  { defId: ENEMY.DireWolf, cost: 12, minWave: 2, weight: 8, clump: 5 },
  { defId: ENEMY.Skeleton, cost: 5, minWave: 3, weight: 7, clump: 8 },
  { defId: ENEMY.Shade, cost: 18, minWave: 4, weight: 6, clump: 4 },
  { defId: ENEMY.Abomination, cost: 30, minWave: 6, weight: 6, clump: 2 },
  { defId: ENEMY.BoneGolem, cost: 20, minWave: 8, weight: 5, clump: 3 },
  { defId: ENEMY.SpiritWarden, cost: 34, minWave: 9, weight: 5, clump: 2 },
  { defId: ENEMY.Shaman, cost: 30, minWave: 11, weight: 4, clump: 1 },
  { defId: ENEMY.Gargoyle, cost: 46, minWave: 12, weight: 4, clump: 2 },
  { defId: ENEMY.Necromancer, cost: 38, minWave: 14, weight: 3, clump: 1 },
];

const BOOK_BOSSES: readonly (readonly [number, number])[] = [
  [ENEMY.Infernal, ENEMY.Minotaur],
  [ENEMY.CircesBeast, ENEMY.Hydra],
  [ENEMY.Charybdis, ENEMY.BoneDragon],
  [ENEMY.Cerberus, ENEMY.Medusa],
  [ENEMY.Talos, ENEMY.Typhon],
  [ENEMY.SirenQueen, ENEMY.Hecatoncheires],
];

const BOSS_ECHOES: Readonly<Record<number, PoolEntry>> = {
  [ENEMY.Infernal]: { defId: ENEMY.YoungCyclops, cost: 38, minWave: 1, weight: 4, clump: 2 },
  [ENEMY.Minotaur]: { defId: ENEMY.MinotaurWarrior, cost: 42, minWave: 1, weight: 4, clump: 2 },
  [ENEMY.CircesBeast]: { defId: ENEMY.EnchantedBoar, cost: 34, minWave: 1, weight: 4, clump: 3 },
  [ENEMY.Hydra]: { defId: ENEMY.HydraSpawn, cost: 48, minWave: 1, weight: 3, clump: 2 },
  [ENEMY.Charybdis]: { defId: ENEMY.CharybdisSpawn, cost: 50, minWave: 1, weight: 3, clump: 2 },
  [ENEMY.BoneDragon]: { defId: ENEMY.ScyllaSpawn, cost: 46, minWave: 1, weight: 3, clump: 2 },
  [ENEMY.Cerberus]: { defId: ENEMY.Hellhound, cost: 52, minWave: 1, weight: 3, clump: 2 },
  [ENEMY.Medusa]: { defId: ENEMY.Gorgon, cost: 56, minWave: 1, weight: 3, clump: 2 },
  [ENEMY.Talos]: { defId: ENEMY.BronzeSentinel, cost: 62, minWave: 1, weight: 3, clump: 2 },
  [ENEMY.Typhon]: { defId: ENEMY.TyphonSpawn, cost: 66, minWave: 1, weight: 3, clump: 2 },
  [ENEMY.SirenQueen]: { defId: ENEMY.LesserSiren, cost: 58, minWave: 1, weight: 3, clump: 2 },
  [ENEMY.Hecatoncheires]: { defId: ENEMY.StoneBrute, cost: 72, minWave: 1, weight: 2, clump: 1 },
};

/** Mythic monsters that have been defeated and may now appear as normal units. */
export function unlockedBossEchoes(mapId: number, wave: number): readonly number[] {
  const book = Math.max(0, Math.min(BOOK_BOSSES.length - 1, mapId));
  const echoes: number[] = [];
  for (let completedBook = 0; completedBook < book; completedBook++) {
    for (const defeatedBoss of BOOK_BOSSES[completedBook]) echoes.push(BOSS_ECHOES[defeatedBoss].defId);
  }
  if (wave > 5) echoes.push(BOSS_ECHOES[BOOK_BOSSES[book][0]].defId);
  return echoes;
}

export interface WavePlan {
  wave: number;
  orders: SpawnOrder[];
  hpPct: number;
  mod: number;
  isBoss: boolean;
  /** Gold handed to every player when the wave is cleared. */
  reward: number;
  /** Human readable line for the HUD. */
  label: string;
}

export function isBossWave(wave: number): boolean {
  return wave % 5 === 0;
}

/** Health multiplier (percent) applied to every enemy in a wave. */
export function waveHpPct(wave: number): number {
  const w = wave - 1;
  return 100 + 24 * w + Math.floor((w * w * 11) / 5);
}

function rollMod(rng: RngHolder, wave: number): number {
  if (wave < 4) return WaveMod.None;
  if (nextInt(rng, 100) < 45) return WaveMod.None;
  const options: number[] = [WaveMod.Hasted, WaveMod.Armoured, WaveMod.Swarm];
  if (wave >= 7) options.push(WaveMod.Regenerating);
  if (wave >= 9) options.push(WaveMod.Shielded);
  return options[nextInt(rng, options.length)];
}

/**
 * Deterministically build the spawn schedule for a wave.
 *
 * Only depends on (matchSeed, wave, laneCount), so both peers generate exactly
 * the same wave without exchanging a single byte about it.
 */
export function generateWave(matchSeed: number, wave: number, laneCount: number, mapId = 0): WavePlan {
  const rng: RngHolder = { rng: deriveSeed(matchSeed, wave * 7919 + 13) };
  const boss = isBossWave(wave);
  const mod = rollMod(rng, wave);
  const hpBase = waveHpPct(wave);

  let hpPct = hpBase;
  if (mod === WaveMod.Armoured) hpPct = Math.floor((hpPct * 110) / 100);
  if (mod === WaveMod.Swarm) hpPct = Math.floor((hpPct * 70) / 100);

  const book = Math.max(0, Math.min(BOOK_BOSSES.length - 1, mapId));
  const unlockedEchoes = unlockedBossEchoes(book, wave).map((defId) =>
    Object.values(BOSS_ECHOES).find((entry) => entry.defId === defId)!,
  );
  const available = [...POOL.filter((p) => p.minWave <= wave), ...unlockedEchoes];
  let budget = 55 + 34 * wave;
  if (mod === WaveMod.Swarm) budget = Math.floor(budget * 1.9);

  // Spread the wave over a window that grows slowly, capped so late waves stay tense.
  const windowTicks = Math.min(sec(26), sec(9) + wave * sec(0.35));

  const orders: SpawnOrder[] = [];
  let guard = 0;
  while (budget > 0 && guard++ < 400) {
    const entry = weightedPick(rng, available, wave);
    if (!entry) break;
    const maxClump = Math.max(1, Math.min(entry.clump, Math.floor(budget / entry.cost)));
    if (maxClump < 1) break;
    const count = 1 + nextInt(rng, maxClump);
    const lane = nextInt(rng, laneCount);
    const start = nextInt(rng, windowTicks);
    const gap = sec(0.22) + nextInt(rng, sec(0.28));
    for (let i = 0; i < count; i++) {
      orders.push({
        at: start + i * gap,
        defId: entry.defId,
        lane,
        wave,
        hpPct,
        boss: false,
        mod,
      });
    }
    budget -= entry.cost * count;
  }

  if (boss) {
    const bossSlot = Math.min(1, Math.floor(wave / 5) - 1);
    const bossId = BOOK_BOSSES[book][bossSlot];
    const bossLane = nextInt(rng, laneCount);
    orders.push({
      at: sec(3),
      defId: bossId,
      lane: bossLane,
      wave,
      hpPct: hpBase,
      boss: true,
      mod: mod === WaveMod.Swarm ? WaveMod.None : mod,
    });
    if (bossId === ENEMY.Charybdis) {
      for (let segment = 0; segment < 4; segment++) {
        orders.push({
          at: sec(3) + (segment + 1) * sec(1.05),
          defId: ENEMY.CharybdisBody,
          lane: bossLane,
          wave,
          hpPct: hpBase,
          boss: false,
          mod: mod === WaveMod.Swarm ? WaveMod.None : mod,
        });
      }
      orders.push({
        at: sec(3) + 5 * sec(1.05),
        defId: ENEMY.CharybdisTail,
        lane: bossLane,
        wave,
        hpPct: hpBase,
        boss: false,
        mod: mod === WaveMod.Swarm ? WaveMod.None : mod,
      });
    }
  }

  // Stable ordering: the spawner pops from the front, so sort by time then by a
  // deterministic tiebreak.
  orders.sort((a, b) => (a.at - b.at) || (a.lane - b.lane) || (a.defId - b.defId));

  const reward = 55 + wave * 14 + (boss ? 120 : 0);
  const modName = mod !== WaveMod.None ? ` · ${WAVE_MOD_INFO[mod].name}` : '';

  return {
    wave,
    orders,
    hpPct,
    mod,
    isBoss: boss,
    reward,
    label: boss ? `Wave ${wave} · BOSS${modName}` : `Wave ${wave}${modName}`,
  };
}

function weightedPick(rng: RngHolder, pool: readonly PoolEntry[], wave: number): PoolEntry | null {
  if (pool.length === 0) return null;
  // Later waves lean harder on the expensive units.
  let total = 0;
  const weights: number[] = [];
  for (const p of pool) {
    const bias = p.cost >= 30 ? Math.min(3, 1 + Math.floor(wave / 10)) : 1;
    const w = p.weight * bias;
    weights.push(w);
    total += w;
  }
  let roll = nextInt(rng, total);
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll < 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/**
 * The three shop offers for a wave. Deterministic from the match seed so both
 * players browse the same stock.
 */
export function generateShop(matchSeed: number, wave: number): { kind: number; id: number }[] {
  const rng: RngHolder = { rng: deriveSeed(matchSeed, wave * 104729 + 7) };
  const relicIds = shuffle(rng, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const itemIds = shuffle(rng, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  return [
    { kind: 0, id: relicIds[0] },
    { kind: 0, id: relicIds[1] },
    { kind: 1, id: itemIds[0] },
    { kind: 1, id: itemIds[1] },
  ];
}
