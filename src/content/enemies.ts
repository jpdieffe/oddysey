import { fx, type Fx } from '../core/fixed';
import { DmgType, sec, TICK_RATE } from '../sim/types';
import { UNIT } from './art';

/** Author speeds in cells-per-second; store cells-per-tick. */
const cps = (cellsPerSecond: number): Fx => Math.floor(fx(cellsPerSecond) / TICK_RATE);

export const EnemyAbility = {
  None: 0,
  Heal: 1,
  Summon: 2,
  ShieldAllies: 3,
  Split: 4,
  Enrage: 5,
} as const;

export interface EnemyDef {
  id: number;
  key: string;
  name: string;
  hp: number;
  speed: Fx;
  armor: number;
  shield: number;
  /** Ticks without damage before the shield starts coming back. */
  shieldDelay: number;
  shieldRegen: number;
  bounty: number;
  xp: number;
  leak: number;
  flying: boolean;
  boss: boolean;
  scale: Fx;
  art: number;
  tint: number;
  /** Percent damage reduction per DmgType; negative means extra damage taken. */
  resist: readonly number[];
  ability: number;
  abilityCd: number;
  abilityPower: number;
  /** Cannot be slowed below this fraction (percent). Bosses shrug off crowd control. */
  ccResist: number;
  desc: string;
}

const noResist = [0, 0, 0, 0, 0, 0];

function def(d: Partial<EnemyDef> & Pick<EnemyDef, 'id' | 'key' | 'name' | 'hp' | 'speed' | 'bounty' | 'art'>): EnemyDef {
  return {
    armor: 0,
    shield: 0,
    shieldDelay: sec(3),
    shieldRegen: 0,
    xp: 3,
    leak: 1,
    flying: false,
    boss: false,
    scale: fx(1),
    tint: 0,
    resist: noResist,
    ability: EnemyAbility.None,
    abilityCd: 0,
    abilityPower: 0,
    ccResist: 0,
    desc: '',
    ...d,
  } as EnemyDef;
}

export const ENEMY = {
  Ghoul: 0,
  DireWolf: 1,
  Skeleton: 2,
  Abomination: 3,
  SpiritWarden: 4,
  Shaman: 5,
  BoneGolem: 6,
  Shade: 7,
  Gargoyle: 8,
  Necromancer: 9,
  Infernal: 10,
  ObsidianColossus: 11,
  BoneDragon: 12,
} as const;

export const ENEMIES: readonly EnemyDef[] = [
  def({
    id: ENEMY.Ghoul, key: 'lotus-raider', name: 'Lotus Raider',
    hp: 62, speed: cps(1.15), armor: 1, bounty: 8, xp: 3,
    art: UNIT.soldierGreen, tint: 0,
    desc: 'A spear-bearing island raider. Ordinary alone, dangerous in a phalanx.',
  }),
  def({
    id: ENEMY.DireWolf, key: 'circes-wolf', name: "Circe's Wolf",
    hp: 40, speed: cps(2.25), bounty: 9, xp: 3,
    art: UNIT.soldierBlue, tint: 1,
    resist: [0, 0, -15, 0, 0, 0],
    desc: 'An enchanted beast that races past slow defenses.',
  }),
  def({
    id: ENEMY.Skeleton, key: 'shade-of-hades', name: 'Shade of Hades',
    hp: 22, speed: cps(2.6), bounty: 4, xp: 1, scale: fx(0.72),
    art: UNIT.soldierGreen, tint: 4,
    desc: 'A restless dead warrior rising from the underworld in great numbers.',
  }),
  def({
    id: ENEMY.Abomination, key: 'laestrygonian', name: 'Laestrygonian Giant',
    hp: 290, speed: cps(0.82), armor: 9, bounty: 22, xp: 10, leak: 2, scale: fx(1.3),
    art: UNIT.tankSand, tint: 2,
    resist: [0, 30, 0, 0, 0, 0],
    ccResist: 30,
    desc: 'A cannibal giant in heavy hides. Fire barely troubles it.',
  }),
  def({
    id: ENEMY.SpiritWarden, key: 'bronze-talos', name: 'Bronze Talos',
    hp: 160, speed: cps(1.0), armor: 3, shield: 170, shieldRegen: 6, bounty: 26, xp: 12,
    art: UNIT.soldierGrey, tint: 3,
    resist: [15, 0, 0, -30, 0, 0],
    desc: 'An ancient bronze guardian whose divine ward repairs itself.',
  }),
  def({
    id: ENEMY.Shaman, key: 'siren-priestess', name: 'Siren Priestess',
    hp: 140, speed: cps(1.0), bounty: 24, xp: 10,
    art: UNIT.soldierOrange, tint: 5,
    ability: EnemyAbility.Heal, abilityCd: sec(2.0), abilityPower: 26,
    desc: 'Her beguiling song restores nearby monsters. Silence her first.',
  }),
  def({
    id: ENEMY.BoneGolem, key: 'hydra-spawn', name: 'Hydra Spawn',
    hp: 120, speed: cps(1.25), bounty: 16, xp: 6, scale: fx(1.1),
    art: UNIT.tankGreen, tint: 0,
    ability: EnemyAbility.Split, abilityPower: 2,
    desc: 'Cut it down and two smaller horrors take its place.',
  }),
  def({
    id: ENEMY.Shade, key: 'harpy', name: 'Harpy',
    hp: 78, speed: cps(1.85), bounty: 14, xp: 5, flying: true,
    art: UNIT.planeGreen, tint: 4,
    resist: [20, 0, 0, 0, 0, 0],
    desc: 'Flies straight for the ship, ignoring every turn in the road.',
  }),
  def({
    id: ENEMY.Gargoyle, key: 'storm-harpy', name: 'Storm Harpy',
    hp: 380, speed: cps(1.2), armor: 5, bounty: 40, xp: 18, flying: true, leak: 2, scale: fx(1.25),
    art: UNIT.planeGrey, tint: 3,
    resist: [10, 0, 10, 0, 0, 0],
    desc: 'A huge armored flyer sent by the angry wind gods.',
  }),
  def({
    id: ENEMY.Necromancer, key: 'hades-oracle', name: 'Oracle of Hades',
    hp: 220, speed: cps(0.92), bounty: 30, xp: 14,
    art: UNIT.soldierOrange, tint: 6,
    ability: EnemyAbility.Summon, abilityCd: sec(3.5), abilityPower: 2,
    resist: [0, 0, 0, 0, 40, 0],
    desc: 'Calls shades from the underworld as it advances.',
  }),
  def({
    id: ENEMY.Infernal, key: 'polyphemus', name: 'Polyphemus',
    hp: 3200, speed: cps(0.62), armor: 16, bounty: 220, xp: 90, leak: 6,
    boss: true, scale: fx(1.95), ccResist: 65,
    art: UNIT.tankSand, tint: 7,
    resist: [10, 15, 10, 0, 0, 0],
    ability: EnemyAbility.Enrage, abilityCd: sec(8), abilityPower: 25,
    desc: 'BOSS — the raging Cyclops grows more dangerous as he is wounded.',
  }),
  def({
    id: ENEMY.ObsidianColossus, key: 'poseidons-colossus', name: "Poseidon's Colossus",
    hp: 6400, speed: cps(0.52), armor: 22, shield: 2200, shieldRegen: 30,
    bounty: 400, xp: 160, leak: 8, boss: true, scale: fx(2.2), ccResist: 75,
    art: UNIT.tankGreen, tint: 8,
    resist: [20, 10, 20, -15, 0, 0],
    ability: EnemyAbility.ShieldAllies, abilityCd: sec(6), abilityPower: 120,
    desc: 'BOSS — a living sea-bronze idol that wards its monstrous escort.',
  }),
  def({
    id: ENEMY.BoneDragon, key: 'scylla', name: 'Scylla',
    hp: 4600, speed: cps(0.72), armor: 13, bounty: 320, xp: 140, leak: 7,
    flying: true, boss: true, scale: fx(2.1), ccResist: 60,
    art: UNIT.planeGrey, tint: 9,
    resist: [25, 0, 0, 0, 15, 0],
    ability: EnemyAbility.Summon, abilityCd: sec(4), abilityPower: 3,
    desc: 'BOSS - a rotting wyrm that keeps disgorging fresh escorts.',
  }),
];

export function enemyDef(id: number): EnemyDef {
  return ENEMIES[id] ?? ENEMIES[0];
}

/** Palette used to recolour the shared soldier/vehicle sprites. */
export const ENEMY_TINTS: readonly string[] = [
  '#5fd36b', // 0 green
  '#4aa8ff', // 1 blue
  '#c98b4b', // 2 tan
  '#9aa7b4', // 3 steel
  '#8ee36b', // 4 lime
  '#ff9c3f', // 5 orange
  '#a76bff', // 6 violet
  '#ff5d4a', // 7 crimson
  '#3ad6c0', // 8 teal
  '#ffd447', // 9 gold
];

export { DmgType };
