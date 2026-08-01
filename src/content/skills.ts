import { fx, type Fx } from '../core/fixed';
import { HERO } from './heroes';
import { sec } from '../sim/types';

export type SkillBranch = 'Passive' | 'Summon' | 'Attack';
export type AttackEffect = 'flameAttacks' | 'axeAttacks' | 'frostAttacks' | 'swordAttacks';

export interface PassiveSkill {
  damagePct: number;
  critPct: number;
  attackRatePct: number;
}

export interface ActiveSkill {
  targeted: boolean;
  radius: Fx;
  castRange: Fx;
  cooldown: number;
  damage: number;
  damagePerLevel: number;
  duration?: number;
  effect: 'guardian' | AttackEffect | 'whirlwind' | 'meteor' | 'heal' | 'frost' | 'storm'
    | 'sentry' | 'wolves' | 'totem' | 'axeThrow' | 'swordWave' | 'greatSwing' | 'bear' | 'ogre';
}

export interface SkillDef {
  id: number;
  heroId: number;
  branch: SkillBranch;
  tier: number;
  name: string;
  desc: string;
  icon: string;
  requires: number;
  passive?: PassiveSkill;
  active?: ActiveSkill;
}

interface HeroTreeTheme {
  heroId: number;
  passiveNames: readonly [string, string, string];
  summonNames: readonly [string, string, string];
  attackNames: readonly [string, string, string];
  helper: string;
  weapon: string;
  passiveIcon: string;
  summonIcon: string;
  attackIcon: string;
  attackEffect: AttackEffect;
}

const THEMES: readonly HeroTreeTheme[] = [
  {
    heroId: HERO.Paladin,
    passiveNames: ['Veteran of Troy', "Athena's Counsel", 'King of Ithaca'],
    summonNames: ['Argos Returns', 'Eumaeus at Arms', 'Ithacan Guard'],
    attackNames: ['Bronze-Edged Arrows', 'Bow of the Beggar', "Odysseus' Reckoning"],
    helper: 'a loyal Ithacan companion', weapon: 'main attacks become enormous piercing bronze shots',
    passiveIcon: '♛', summonIcon: '🐕', attackIcon: '🏹', attackEffect: 'swordAttacks',
  },
  {
    heroId: HERO.Orc,
    passiveNames: ['Towering Stature', 'Sevenfold Hide', 'Bulwark of Achaea'],
    summonNames: ['Teucer Arrives', 'Shield-Brother', 'Salamian Phalanx'],
    attackNames: ['Heavy Kopis', 'Great Shield Bash', "Ajax's Rampage"],
    helper: 'an armored Salamian shield-brother', weapon: 'main attacks become colossal axe-like cleaves',
    passiveIcon: '🛡', summonIcon: '⚔', attackIcon: '🪓', attackEffect: 'axeAttacks',
  },
  {
    heroId: HERO.DarkElf,
    passiveNames: ['Herbal Lore', "Hecate's Student", 'Mistress of Aeaea'],
    summonNames: ['Enchanted Boar', "Circe's Lion", 'Witch-Hound Pack'],
    attackNames: ['Ember Wand', 'Transformation Hex', 'Fire of Aeaea'],
    helper: 'an enchanted beast from Aeaea', weapon: 'main attacks become burning transformation bolts',
    passiveIcon: '☾', summonIcon: '🐗', attackIcon: '🔥', attackEffect: 'flameAttacks',
  },
  {
    heroId: HERO.HighElf,
    passiveNames: ['Fleet-Footed', "Artemis' Favor", 'Calydonian Hunter'],
    summonNames: ['Hunting Hound', 'Arcadian Stag', "Artemis' Lioness"],
    attackNames: ['Moonlit Arrows', 'Piercing Volley', "Atalanta's Tempest"],
    helper: 'a swift sacred hunting animal', weapon: 'main attacks become huge slowing moon-arrows',
    passiveIcon: '🪽', summonIcon: '🐺', attackIcon: '🏹', attackEffect: 'frostAttacks',
  },
  {
    heroId: HERO.Magician,
    passiveNames: ['Cyclopean Strength', "Poseidon's Blood", 'Master Smith'],
    summonNames: ['Cave Ram', 'Young Cyclops', 'Stone Giant'],
    attackNames: ['Boulder Grip', 'Volcanic Stone', "Polyphemus' Avalanche"],
    helper: 'a hulking creature from the Cyclops caves', weapon: 'main attacks become gigantic hurled boulders and axes',
    passiveIcon: '👁', summonIcon: '🐏', attackIcon: '🪨', attackEffect: 'axeAttacks',
  },
] as const;

const makeTree = (theme: HeroTreeTheme, heroIndex: number): SkillDef[] => {
  const base = heroIndex * 9;
  const result: SkillDef[] = [];
  for (let tier = 1; tier <= 3; tier++) {
    const id = base + tier - 1;
    result.push({
      id, heroId: theme.heroId, branch: 'Passive', tier,
      name: theme.passiveNames[tier - 1], icon: theme.passiveIcon,
      desc: `PASSIVE • Permanently gain ${8 + tier * 4}% attack damage, ${tier * 3}% critical chance, and ${tier * 4}% attack speed.`,
      requires: tier === 1 ? -1 : id - 1,
      passive: { damagePct: 8 + tier * 4, critPct: tier * 3, attackRatePct: tier * 4 },
    });
  }
  for (let tier = 1; tier <= 3; tier++) {
    const id = base + 3 + tier - 1;
    const duration = 14 + tier * 5;
    result.push({
      id, heroId: theme.heroId, branch: 'Summon', tier,
      name: theme.summonNames[tier - 1], icon: theme.summonIcon,
      desc: `ACTIVE • Call ${theme.helper} that follows you and fights for ${duration} seconds.`,
      requires: tier === 1 ? -1 : id - 1,
      active: { targeted: false, radius: fx(0.8), castRange: 0, cooldown: sec(31 - tier * 3), duration: sec(duration), damage: 0, damagePerLevel: 0, effect: 'guardian' },
    });
  }
  for (let tier = 1; tier <= 3; tier++) {
    const id = base + 6 + tier - 1;
    const duration = 8 + tier * 3;
    result.push({
      id, heroId: theme.heroId, branch: 'Attack', tier,
      name: theme.attackNames[tier - 1], icon: theme.attackIcon,
      desc: `ACTIVE • For ${duration} seconds, ${theme.weapon}; damage is increased by 35%.`,
      requires: tier === 1 ? -1 : id - 1,
      active: { targeted: false, radius: 0, castRange: 0, cooldown: sec(25 - tier * 2), duration: sec(duration), damage: 0, damagePerLevel: 0, effect: theme.attackEffect },
    });
  }
  return result;
};

export const SKILLS: readonly SkillDef[] = THEMES.flatMap(makeTree);

export const skillDef = (id: number): SkillDef => SKILLS[id] ?? SKILLS[0];
export const hasSkill = (skills: readonly number[], id: number): boolean => skills.includes(id);
export const heroSkills = (heroId: number): readonly SkillDef[] => SKILLS.filter((s) => s.heroId === heroId);
export const activeSkills = (skills: readonly number[]): readonly SkillDef[] =>
  SKILLS.filter((s) => !!s.active && hasSkill(skills, s.id));
export const passiveBonuses = (skills: readonly number[]): PassiveSkill => {
  const total: PassiveSkill = { damagePct: 0, critPct: 0, attackRatePct: 0 };
  for (const id of skills) {
    const bonus = skillDef(id).passive;
    if (!bonus) continue;
    total.damagePct += bonus.damagePct;
    total.critPct += bonus.critPct;
    total.attackRatePct += bonus.attackRatePct;
  }
  return total;
};
export function availableSkills(skills: readonly number[], heroId: number): readonly SkillDef[] {
  return SKILLS.filter((s) => s.heroId === heroId && !hasSkill(skills, s.id)
    && (s.requires < 0 || hasSkill(skills, s.requires)));
}
