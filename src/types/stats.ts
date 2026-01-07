/**
 * Stat system types for Dragon Gate
 * Defines primary stats, derived stats, and combat formulas
 */

/** Definition of a primary stat (STR, DEX, etc.) */
export interface StatDefinition {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short abbreviation (e.g., "STR") */
  abbrev: string;
  /** Description of what this stat affects */
  description: string;
  /** Default starting value */
  defaultValue: number;
  /** Minimum allowed value */
  minValue: number;
  /** Maximum allowed value */
  maxValue: number;
}

/** Definition of a derived stat (Max HP, Physical Attack, etc.) */
export interface DerivedStatDefinition {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Formula string referencing primary stats (e.g., "con * 10 + 50") */
  formula: string;
}

/** A collection of stat values keyed by stat ID */
export interface StatBlock {
  [statId: string]: number;
}

/** Combat formula definitions */
export interface CombatFormulas {
  /** Formula for physical damage calculation */
  physicalDamage: string;
  /** Formula for magic damage calculation */
  magicDamage: string;
  /** Formula for critical hit check */
  criticalCheck: string;
  /** Formula for turn order calculation */
  turnOrder: string;
}

/** Complete stat system configuration */
export interface StatsConfig {
  /** Primary stat definitions */
  primary: StatDefinition[];
  /** Derived stat definitions */
  derived: DerivedStatDefinition[];
  /** Combat formula overrides */
  combatFormulas?: CombatFormulas;
}
