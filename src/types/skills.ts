/**
 * Skill system types for Dragon Gate
 * Defines abilities, their effects, and targeting
 */

/** Type of skill */
export type SkillType = 'physical' | 'magic' | 'healing' | 'buff' | 'debuff' | 'defense' | 'special';

/** What the skill can target */
export type TargetType = 'self' | 'single' | 'all' | 'allies' | 'allAllies';

/** A skill definition */
export interface Skill {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Skill description */
  description: string;
  /** Type of skill */
  type: SkillType;
  /** Category for UI grouping (e.g., "Fire", "Ice", "Support") */
  category?: string;
  /** MP cost to use */
  mpCost: number;
  /** HP cost to use (for special skills) */
  hpCost?: number;
  /** Base power for damage/healing calculation */
  power?: number;
  /** Target type */
  target?: TargetType;
  /** Value for special effects (e.g., defense reduction percentage) */
  value?: number;
  /** Buff effect if this is a buff skill */
  buffEffect?: SkillBuffEffect;
  /** Debuff effect if this is a debuff skill */
  debuffEffect?: SkillDebuffEffect;
  /** Cooldown in turns */
  cooldown?: number;
  /** Requirements to learn/use this skill */
  requirements?: SkillRequirements;
}

/** Buff effect configuration */
export interface SkillBuffEffect {
  /** Stat to buff */
  stat: string;
  /** Flat or percentage */
  type?: 'flat' | 'percent';
  /** Value to apply */
  value: number;
  /** Duration in turns */
  duration: number;
}

/** Debuff effect configuration (same structure as buff) */
export type SkillDebuffEffect = SkillBuffEffect;

/** Requirements to learn or use a skill */
export interface SkillRequirements {
  /** Minimum level required */
  level?: number;
  /** Minimum stat values required */
  stats?: Record<string, number>;
  /** Other skills that must be learned first */
  previousSkills?: string[];
}
