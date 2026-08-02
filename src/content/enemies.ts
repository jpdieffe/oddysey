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
  Minotaur: 13,
  CircesBeast: 14,
  Hydra: 15,
  Charybdis: 16,
  YoungCyclops: 17,
  MinotaurWarrior: 18,
  EnchantedBoar: 19,
  HydraSpawn: 20,
  CharybdisSpawn: 21,
  ScyllaSpawn: 22,
  CharybdisBody: 23,
  CharybdisTail: 24,
  Cerberus: 25,
  Hellhound: 26,
  Medusa: 27,
  Gorgon: 28,
  Talos: 29,
  BronzeSentinel: 30,
  Typhon: 31,
  TyphonSpawn: 32,
  SirenQueen: 33,
  LesserSiren: 34,
  Hecatoncheires: 35,
  StoneBrute: 36,
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
  def({
    id: ENEMY.Minotaur, key: 'minotaur-boss', name: 'The Minotaur',
    hp: 3900, speed: cps(0.8), armor: 17, bounty: 260, xp: 110, leak: 6,
    boss: true, scale: fx(2), ccResist: 65, art: UNIT.tankGreen, tint: 2,
    ability: EnemyAbility.Enrage, abilityCd: sec(7), abilityPower: 30,
    desc: 'BOSS — the raging bull of the labyrinth charges harder as it is wounded.',
  }),
  def({
    id: ENEMY.CircesBeast, key: 'circes-beast-boss', name: "Circe's Chimera",
    hp: 4200, speed: cps(0.9), armor: 10, bounty: 290, xp: 120, leak: 6,
    boss: true, scale: fx(2), ccResist: 60, art: UNIT.tankSand, tint: 6,
    ability: EnemyAbility.Summon, abilityCd: sec(5), abilityPower: 2,
    desc: 'BOSS — a sailor transformed into a many-formed monster by Circe.',
  }),
  def({
    id: ENEMY.Hydra, key: 'hydra-boss', name: 'The Lernaean Hydra',
    hp: 5600, speed: cps(0.58), armor: 14, bounty: 360, xp: 150, leak: 8,
    boss: true, scale: fx(2.2), ccResist: 72, art: UNIT.tankGreen, tint: 0,
    ability: EnemyAbility.Split, abilityPower: 3,
    desc: 'BOSS — every severed head becomes another threat on the road.',
  }),
  def({
    id: ENEMY.Charybdis, key: 'charybdis-boss', name: 'Charybdis',
    hp: 2600, speed: cps(0.5), armor: 20, shield: 700, shieldRegen: 10,
    bounty: 180, xp: 70, leak: 5, boss: true, scale: fx(1.8), ccResist: 78,
    art: UNIT.planeGreen, tint: 1,
    ability: EnemyAbility.ShieldAllies, abilityCd: sec(6), abilityPower: 100,
    desc: 'BOSS — an abyssal worm whose independently living armored segments must all be slain.',
  }),
  def({
    id: ENEMY.YoungCyclops, key: 'young-cyclops', name: 'Young Cyclops',
    hp: 360, speed: cps(0.78), armor: 8, bounty: 30, xp: 12, leak: 2,
    scale: fx(1.25), art: UNIT.tankSand, tint: 7,
    desc: 'A lesser Cyclops encountered after surviving Polyphemus.',
  }),
  def({
    id: ENEMY.MinotaurWarrior, key: 'minotaur-warrior', name: 'Minotaur Warrior',
    hp: 430, speed: cps(0.9), armor: 10, bounty: 34, xp: 14, leak: 2,
    scale: fx(1.25), art: UNIT.tankGreen, tint: 2,
    desc: 'A lesser bull-warrior released after the labyrinth lord falls.',
  }),
  def({
    id: ENEMY.EnchantedBoar, key: 'lesser-chimera', name: 'Lesser Chimera',
    hp: 300, speed: cps(1.2), armor: 5, bounty: 28, xp: 11,
    scale: fx(1.15), art: UNIT.tankSand, tint: 6,
    desc: "A smaller spawn of Circe's many-headed champion, now roaming normal waves.",
  }),
  def({
    id: ENEMY.HydraSpawn, key: 'lesser-hydra', name: 'Lesser Hydra',
    hp: 520, speed: cps(0.72), armor: 9, bounty: 42, xp: 17, leak: 2,
    scale: fx(1.3), art: UNIT.tankGreen, tint: 0,
    ability: EnemyAbility.Split, abilityPower: 2,
    desc: 'A smaller many-headed horror spawned after the great Hydra is slain.',
  }),
  def({
    id: ENEMY.CharybdisSpawn, key: 'whirlpool-spawn', name: 'Whirlpool Spawn',
    hp: 470, speed: cps(0.85), shield: 180, shieldRegen: 4, bounty: 40, xp: 16,
    scale: fx(1.2), art: UNIT.planeGreen, tint: 1,
    desc: 'A lesser living vortex torn from Charybdis.',
  }),
  def({
    id: ENEMY.ScyllaSpawn, key: 'scylla-spawn', name: 'Scylla Spawn',
    hp: 440, speed: cps(1.05), armor: 7, bounty: 38, xp: 16, leak: 2,
    scale: fx(1.22), art: UNIT.planeGrey, tint: 9,
    desc: 'A smaller sea horror that follows in Scylla’s wake.',
  }),
  def({
    id: ENEMY.CharybdisBody, key: 'charybdis-body', name: 'Charybdis Body',
    hp: 900, speed: cps(0.5), armor: 17, shield: 220, shieldRegen: 4,
    bounty: 65, xp: 28, leak: 1, scale: fx(1.55), ccResist: 62,
    art: UNIT.tankGreen, tint: 1,
    desc: 'One independently living armored section of Charybdis.',
  }),
  def({
    id: ENEMY.CharybdisTail, key: 'charybdis-tail', name: 'Charybdis Tail',
    hp: 750, speed: cps(0.5), armor: 15, shield: 180, shieldRegen: 3,
    bounty: 55, xp: 24, leak: 1, scale: fx(1.45), ccResist: 55,
    art: UNIT.tankGreen, tint: 1,
    desc: 'The final bladed tail section of Charybdis.',
  }),
  def({
    id: ENEMY.Cerberus, key: 'cerberus-boss', name: 'Cerberus',
    hp: 6600, speed: cps(0.92), armor: 18, bounty: 410, xp: 175, leak: 8,
    boss: true, scale: fx(2.15), ccResist: 75, art: UNIT.tankSand, tint: 7,
    ability: EnemyAbility.Enrage, abilityCd: sec(6), abilityPower: 35,
    desc: 'BOSS - the three-headed hound of Hades becomes savage as its life falls.',
  }),
  def({
    id: ENEMY.Hellhound, key: 'hellhound', name: 'Hellhound',
    hp: 590, speed: cps(1.35), armor: 7, bounty: 46, xp: 18, leak: 2,
    scale: fx(1.22), art: UNIT.tankSand, tint: 7,
    desc: 'A swift underworld hound unleashed after Cerberus is defeated.',
  }),
  def({
    id: ENEMY.Medusa, key: 'medusa-boss', name: 'Medusa',
    hp: 7200, speed: cps(0.74), armor: 14, shield: 900, shieldRegen: 12,
    bounty: 460, xp: 195, leak: 9, boss: true, scale: fx(2.1), ccResist: 80,
    art: UNIT.soldierGreen, tint: 0, ability: EnemyAbility.ShieldAllies,
    abilityCd: sec(5), abilityPower: 135,
    desc: 'BOSS - the Gorgon queen turns divine wards to stone around her escort.',
  }),
  def({
    id: ENEMY.Gorgon, key: 'gorgon-warrior', name: 'Gorgon Warrior',
    hp: 640, speed: cps(0.94), armor: 11, bounty: 50, xp: 20, leak: 2,
    scale: fx(1.2), art: UNIT.soldierGreen, tint: 0,
    desc: 'A lesser snake-haired huntress encountered after Medusa falls.',
  }),
  def({
    id: ENEMY.Talos, key: 'talos-boss', name: 'Talos of Crete',
    hp: 8800, speed: cps(0.5), armor: 27, shield: 1400, shieldRegen: 18,
    bounty: 520, xp: 220, leak: 10, boss: true, scale: fx(2.35), ccResist: 85,
    art: UNIT.soldierOrange, tint: 5, ability: EnemyAbility.ShieldAllies,
    abilityCd: sec(6), abilityPower: 170,
    desc: 'BOSS - the bronze guardian of Crete marches behind a renewing metal ward.',
  }),
  def({
    id: ENEMY.BronzeSentinel, key: 'bronze-sentinel', name: 'Bronze Sentinel',
    hp: 760, speed: cps(0.68), armor: 18, shield: 220, shieldRegen: 5,
    bounty: 58, xp: 23, leak: 2, scale: fx(1.3), art: UNIT.soldierOrange, tint: 5,
    desc: 'A smaller bronze construct awakened after Talos is broken.',
  }),
  def({
    id: ENEMY.Typhon, key: 'typhon-boss', name: 'Typhon',
    hp: 9800, speed: cps(0.58), armor: 20, bounty: 590, xp: 250, leak: 11,
    boss: true, scale: fx(2.45), ccResist: 88, art: UNIT.tankGreen, tint: 6,
    resist: [20, 35, 10, 0, 0, 0], ability: EnemyAbility.Summon,
    abilityCd: sec(4.5), abilityPower: 4,
    desc: 'BOSS - the storm father of monsters calls fresh horrors into his wake.',
  }),
  def({
    id: ENEMY.TyphonSpawn, key: 'typhon-spawn', name: 'Typhon Spawn',
    hp: 820, speed: cps(0.82), armor: 13, bounty: 62, xp: 25, leak: 2,
    scale: fx(1.3), art: UNIT.tankGreen, tint: 6,
    desc: 'A storm-born serpent spawned after Typhon is overcome.',
  }),
  def({
    id: ENEMY.SirenQueen, key: 'siren-queen-boss', name: 'Queen of the Sirens',
    hp: 8200, speed: cps(0.9), armor: 12, bounty: 560, xp: 235, leak: 10,
    flying: true, boss: true, scale: fx(2.25), ccResist: 82,
    art: UNIT.planeGrey, tint: 6, ability: EnemyAbility.Heal,
    abilityCd: sec(3.5), abilityPower: 90,
    desc: 'BOSS - her battle-song restores every monster that can hear it.',
  }),
  def({
    id: ENEMY.LesserSiren, key: 'lesser-siren', name: 'Lesser Siren',
    hp: 520, speed: cps(1.3), armor: 6, bounty: 48, xp: 19, flying: true,
    scale: fx(1.18), art: UNIT.planeGrey, tint: 6,
    desc: 'A predatory singer that joins normal waves after her queen is defeated.',
  }),
  def({
    id: ENEMY.Hecatoncheires, key: 'hecatoncheires-boss', name: 'Hecatoncheires',
    hp: 11200, speed: cps(0.46), armor: 30, bounty: 680, xp: 290, leak: 12,
    boss: true, scale: fx(2.6), ccResist: 92, art: UNIT.tankSand, tint: 3,
    ability: EnemyAbility.Enrage, abilityCd: sec(5), abilityPower: 42,
    desc: 'FINAL BOSS - a many-armed primordial giant whose blows shake the road itself.',
  }),
  def({
    id: ENEMY.StoneBrute, key: 'stone-brute', name: 'Stone Brute',
    hp: 980, speed: cps(0.6), armor: 22, bounty: 70, xp: 28, leak: 3,
    scale: fx(1.38), art: UNIT.tankSand, tint: 3,
    desc: 'A lesser primordial giant that appears after the Hecatoncheires is slain.',
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
