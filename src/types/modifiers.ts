/**
 * Modifier system types for Dragon Gate
 * Handles buffs, debuffs, equipment bonuses, etc.
 */

/** Source type for a modifier */
export type ModifierSource = 'equipment' | 'buff' | 'debuff' | 'perk' | 'skill' | 'item';

/** How the modifier value is applied */
export type ModifierValueType = 'flat' | 'percent';

/** A single modifier effect */
export interface Modifier {
  /** Unique identifier for this modifier instance */
  id: string;
  /** Source of this modifier (skill ID, equipment ID, etc.) */
  source: string;
  /** Stat being modified */
  stat: string;
  /** How the value is applied */
  type: ModifierValueType;
  /** The modification value */
  value: number;
  /** Duration in turns (-1 for permanent) */
  duration: number;
}

/** A modifier with additional runtime tracking */
export interface ActiveModifier extends Modifier {
  /** Remaining turns until expiration */
  remainingDuration: number;
}

/** Modifier definition in game data (template) */
export interface ModifierDefinition {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Icon identifier */
  icon?: string;
  /** Effects this modifier applies */
  effects: ModifierEffect[];
  /** Duration in turns (undefined = permanent) */
  duration?: number;
  /** Whether multiple can stack */
  stackable: boolean;
  /** Maximum stacks if stackable */
  maxStacks?: number;
}

/** Single effect within a modifier definition */
export interface ModifierEffect {
  /** Stat to modify */
  stat: string;
  /** Flat or percentage */
  valueType: ModifierValueType;
  /** The value to apply */
  value: number;
}
