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
  passiveNames: readonly [string, string, string, string, string];
  summonNames: readonly [string, string, string, string, string];
  attackNames: readonly [string, string, string, string, string];
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
    passiveNames: ['Veteran of Troy', "Athena's Counsel", 'King of Ithaca', 'Master Strategist', 'Favored of Olympus'],
    summonNames: ['Argos Returns', 'Eumaeus at Arms', 'Ithacan Guard', "Athena's Owl", 'Achaean Champion'],
    attackNames: ['Bronze-Edged Arrows', 'Bow of the Beggar', "Odysseus' Reckoning", 'Spear of Troy', 'Wrath of Ithaca'],
    helper: 'a loyal Ithacan companion', weapon: 'main attacks become enormous piercing bronze shots',
    passiveIcon: '♛', summonIcon: '🐕', attackIcon: '🏹', attackEffect: 'swordAttacks',
  },
  {
    heroId: HERO.Orc,
    passiveNames: ['Towering Stature', 'Sevenfold Hide', 'Bulwark of Achaea', 'Unbroken Wall', 'Might of Telamon'],
    summonNames: ['War Hound', 'Teucer Arrives', 'Shield-Brother', 'Salamian Phalanx', 'Telamonian Titan'],
    attackNames: ['Bronze Axe', 'Whirling Labrys', "Ajax's Returning Axe", 'Stormsplitter', 'Achaean Executioner'],
    helper: 'an armored Salamian shield-brother', weapon: 'main attacks throw enormous, rapidly spinning axes',
    passiveIcon: '🛡', summonIcon: '⚔', attackIcon: '🪓', attackEffect: 'axeAttacks',
  },
  {
    heroId: HERO.DarkElf,
    passiveNames: ['Herbal Lore', "Hecate's Student", 'Mistress of Aeaea', 'Immortal Enchantress', 'Queen of Transformations'],
    summonNames: ['Enchanted Boar', "Circe's Lion", 'Witch-Hound', 'Moonwing Harpy', 'Chimera Familiar'],
    attackNames: ['Ember Wand', 'Transformation Hex', 'Fire of Aeaea', "Hecate's Comet", 'Solar Transfiguration'],
    helper: 'an enchanted beast from Aeaea', weapon: 'main attacks become burning transformation bolts',
    passiveIcon: '☾', summonIcon: '🐗', attackIcon: '🔥', attackEffect: 'flameAttacks',
  },
  {
    heroId: HERO.HighElf,
    passiveNames: ['Fleet-Footed', "Artemis' Favor", 'Calydonian Hunter', 'Unerring Aim', 'First Among Hunters'],
    summonNames: ['Hunting Hound', 'Arcadian Stag', "Artemis' Lioness", 'Moonwing Griffin', 'Calydonian Guardian'],
    attackNames: ['Moonlit Arrows', 'Piercing Volley', "Atalanta's Tempest", 'Starfall Bow', "Artemis' Judgment"],
    helper: 'a swift sacred hunting animal', weapon: 'main attacks become huge slowing moon-arrows',
    passiveIcon: '🪽', summonIcon: '🐺', attackIcon: '🏹', attackEffect: 'frostAttacks',
  },
  {
    heroId: HERO.Magician,
    passiveNames: ['Cyclopean Strength', "Poseidon's Blood", 'Master Smith', 'Mountain-Born', 'World-Shaking Might'],
    summonNames: ['Cave Ram', 'Young Cyclops', 'Stone Giant', 'Armored Cyclops', 'Elder Titan'],
    attackNames: ['Boulder Grip', 'Volcanic Stone', "Polyphemus' Avalanche", 'Mountain Hurl', "Poseidon's Meteor"],
    helper: 'a hulking creature from the Cyclops caves', weapon: 'main attacks change from melee blows into gigantic hurled boulders',
    passiveIcon: '👁', summonIcon: '🐏', attackIcon: '🪨', attackEffect: 'axeAttacks',
  },
] as const;

const makeTree = (theme: HeroTreeTheme, heroIndex: number): SkillDef[] => {
  // IDs start at 100 so saves made with the retired shared tree are
  // unambiguously refunded instead of being mistaken for unrelated new nodes.
  const base = 100 + heroIndex * 15;
  const result: SkillDef[] = [];
  for (let tier = 1; tier <= 5; tier++) {
    const id = base + tier - 1;
    result.push({
      id, heroId: theme.heroId, branch: 'Passive', tier,
      name: theme.passiveNames[tier - 1], icon: theme.passiveIcon,
      desc: `PASSIVE • Permanently gain ${8 + tier * 4}% attack damage, ${tier * 3}% critical chance, and ${tier * 4}% attack speed.`,
      requires: tier === 1 ? -1 : id - 1,
      passive: { damagePct: 8 + tier * 4, critPct: tier * 3, attackRatePct: tier * 4 },
    });
  }
  for (let tier = 1; tier <= 5; tier++) {
    const id = base + 5 + tier - 1;
    const duration = 14 + tier * 5;
    result.push({
      id, heroId: theme.heroId, branch: 'Summon', tier,
      name: theme.summonNames[tier - 1], icon: theme.summonIcon,
      desc: `ACTIVE • ${theme.summonNames[tier - 1]} replaces the previous helper, follows you, and fights for ${duration} seconds.`,
      requires: tier === 1 ? -1 : id - 1,
      active: { targeted: false, radius: fx(0.8), castRange: 0, cooldown: sec(31 - tier * 3), duration: sec(duration), damage: 0, damagePerLevel: 0, effect: 'guardian' },
    });
  }
  const damageBoosts = [35, 60, 90, 130, 180] as const;
  for (let tier = 1; tier <= 5; tier++) {
    const id = base + 10 + tier - 1;
    const duration = 8 + tier * 3;
    result.push({
      id, heroId: theme.heroId, branch: 'Attack', tier,
      name: theme.attackNames[tier - 1], icon: theme.attackIcon,
      desc: `ACTIVE • Replaces the previous transformation. For ${duration} seconds, ${theme.weapon}; attacks glow with tier ${tier} power and deal +${damageBoosts[tier - 1]}% damage.`,
      requires: tier === 1 ? -1 : id - 1,
      active: { targeted: false, radius: 0, castRange: 0, cooldown: sec(25 - tier * 2), duration: sec(duration), damage: 0, damagePerLevel: 0, effect: theme.attackEffect },
    });
  }
  return result;
};

export const SKILLS: readonly SkillDef[] = THEMES.flatMap(makeTree);
export const SKILL_SLOT_COUNT = 175;

export const skillDef = (id: number): SkillDef => SKILLS.find((skill) => skill.id === id) ?? SKILLS[0];
export const hasSkill = (skills: readonly number[], id: number): boolean => skills.includes(id);
export const heroSkills = (heroId: number): readonly SkillDef[] => SKILLS.filter((s) => s.heroId === heroId);
export const activeSkills = (skills: readonly number[]): readonly SkillDef[] => {
  const best = new Map<string, SkillDef>();
  for (const skill of SKILLS) {
    if (!skill.active || !hasSkill(skills, skill.id)) continue;
    const key = `${skill.heroId}:${skill.branch}`;
    const previous = best.get(key);
    if (!previous || skill.tier > previous.tier) best.set(key, skill);
  }
  return [...best.values()].sort((a, b) => a.id - b.id);
};
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
