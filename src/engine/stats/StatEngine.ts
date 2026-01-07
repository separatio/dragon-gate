/**
 * Stat Engine
 * Calculates derived stats from primary stats using developer-defined formulas
 */

import { formulaParser } from '../formula';
import type {
  StatDefinition,
  DerivedStatDefinition,
  StatBlock,
  CombatFormulas,
  StatsConfig,
} from '../../types/stats';

/** Configuration for the stat engine */
export interface StatEngineConfig {
  /** Primary stat definitions */
  primaryStats: StatDefinition[];
  /** Derived stat definitions */
  derivedStats: DerivedStatDefinition[];
  /** Combat formula definitions */
  combatFormulas: CombatFormulas;
}

/** Default combat formulas */
const DEFAULT_COMBAT_FORMULAS: CombatFormulas = {
  physicalDamage: 'Attack * (100 / (100 + EnemyDef))',
  magicDamage: 'MagicPower * (100 / (100 + EnemyRes))',
  criticalCheck: 'CritRate',
  turnOrder: 'Speed + Dexterity * 0.5',
};

/**
 * StatEngine class
 * Manages stat calculations for characters and combat
 */
export class StatEngine {
  private config: StatEngineConfig;

  constructor(config: StatEngineConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Create a StatEngine from a StatsConfig (game definition format)
   */
  static fromStatsConfig(statsConfig: StatsConfig): StatEngine {
    return new StatEngine({
      primaryStats: statsConfig.primary,
      derivedStats: statsConfig.derived,
      combatFormulas: statsConfig.combatFormulas ?? DEFAULT_COMBAT_FORMULAS,
    });
  }

  /**
   * Validate that all formulas reference valid stats
   */
  private validateConfig(): void {
    const primaryStatIds = new Set(this.config.primaryStats.map((s) => s.id));
    const derivedStatIds = new Set(this.config.derivedStats.map((s) => s.id));

    // Build order-dependent set of available variables
    const availableVars = new Set<string>(['Level']);
    for (const id of primaryStatIds) {
      availableVars.add(id);
    }

    // Validate derived stat formulas (in order, since they can chain)
    for (const derived of this.config.derivedStats) {
      const validation = formulaParser.validate(derived.formula);
      if (!validation.valid) {
        throw new Error(
          `Invalid formula for derived stat '${derived.id}': ${validation.error}`
        );
      }

      const requiredVars = formulaParser.getVariables(derived.formula);
      for (const varName of requiredVars) {
        if (!availableVars.has(varName)) {
          throw new Error(
            `Derived stat '${derived.id}' references unknown stat '${varName}'`
          );
        }
      }

      // This derived stat is now available for subsequent formulas
      availableVars.add(derived.id);
    }

    // Validate combat formulas
    this.validateCombatFormula('physicalDamage', primaryStatIds, derivedStatIds);
    this.validateCombatFormula('magicDamage', primaryStatIds, derivedStatIds);
    this.validateCombatFormula('criticalCheck', primaryStatIds, derivedStatIds);
    this.validateCombatFormula('turnOrder', primaryStatIds, derivedStatIds);
  }

  /**
   * Validate a combat formula
   */
  private validateCombatFormula(
    formulaName: keyof CombatFormulas,
    primaryIds: Set<string>,
    derivedIds: Set<string>
  ): void {
    const formula = this.config.combatFormulas[formulaName];
    const validation = formulaParser.validate(formula);
    if (!validation.valid) {
      throw new Error(
        `Invalid combat formula '${formulaName}': ${validation.error}`
      );
    }

    // Combat formulas can reference special variables like EnemyDef, EnemyRes, EnemySpeed
    const specialVars = new Set(['EnemyDef', 'EnemyRes', 'EnemySpeed', 'EnemyEvasion', 'Level']);
    const requiredVars = formulaParser.getVariables(formula);
    for (const varName of requiredVars) {
      if (!primaryIds.has(varName) && !derivedIds.has(varName) && !specialVars.has(varName)) {
        throw new Error(
          `Combat formula '${formulaName}' references unknown stat '${varName}'`
        );
      }
    }
  }

  /**
   * Create a new stat block with default values
   */
  createDefaultStatBlock(): StatBlock {
    const block: StatBlock = {};
    for (const stat of this.config.primaryStats) {
      block[stat.id] = stat.defaultValue;
    }
    return block;
  }

  /**
   * Calculate all derived stats from primary stats
   * @param primaryStats - The primary stat values
   * @param level - Character level (default 1)
   * @returns Derived stat values
   */
  calculateDerivedStats(primaryStats: StatBlock, level: number = 1): StatBlock {
    const context = { ...primaryStats, Level: level };
    const derived: StatBlock = {};

    // Calculate in order (allows derived stats to reference earlier ones)
    for (const stat of this.config.derivedStats) {
      const value = formulaParser.compute(stat.formula, { ...context, ...derived });
      derived[stat.id] = Math.floor(value); // Round down for RPG conventions
    }

    return derived;
  }

  /**
   * Get complete stats (primary + derived)
   * @param primaryStats - The primary stat values
   * @param level - Character level (default 1)
   * @returns Combined stat block
   */
  getCompleteStats(primaryStats: StatBlock, level: number = 1): StatBlock {
    const derived = this.calculateDerivedStats(primaryStats, level);
    return { ...primaryStats, Level: level, ...derived };
  }

  /**
   * Calculate physical damage
   * @param attackerStats - Complete stats of attacker
   * @param defenderStats - Complete stats of defender
   * @returns Damage value (minimum 1)
   */
  calculatePhysicalDamage(attackerStats: StatBlock, defenderStats: StatBlock): number {
    const context = {
      ...attackerStats,
      EnemyDef: defenderStats.Defense ?? 0,
      EnemyRes: defenderStats.MagicResist ?? 0,
    };
    const damage = formulaParser.compute(this.config.combatFormulas.physicalDamage, context);
    return Math.max(1, Math.floor(damage));
  }

  /**
   * Calculate magic damage
   * @param attackerStats - Complete stats of attacker
   * @param defenderStats - Complete stats of defender
   * @returns Damage value (minimum 1)
   */
  calculateMagicDamage(attackerStats: StatBlock, defenderStats: StatBlock): number {
    const context = {
      ...attackerStats,
      EnemyDef: defenderStats.Defense ?? 0,
      EnemyRes: defenderStats.MagicResist ?? 0,
    };
    const damage = formulaParser.compute(this.config.combatFormulas.magicDamage, context);
    return Math.max(1, Math.floor(damage));
  }

  /**
   * Calculate critical hit chance (0-100)
   * @param attackerStats - Complete stats of attacker
   * @returns Critical chance percentage
   */
  calculateCritChance(attackerStats: StatBlock): number {
    const chance = formulaParser.compute(this.config.combatFormulas.criticalCheck, attackerStats);
    return Math.min(100, Math.max(0, chance));
  }

  /**
   * Calculate turn order value (higher = faster)
   * @param stats - Complete stats
   * @returns Turn order value
   */
  calculateTurnOrder(stats: StatBlock): number {
    return formulaParser.compute(this.config.combatFormulas.turnOrder, stats);
  }

  /**
   * Get primary stat definition by ID
   */
  getStatDefinition(statId: string): StatDefinition | undefined {
    return this.config.primaryStats.find((s) => s.id === statId);
  }

  /**
   * Get derived stat definition by ID
   */
  getDerivedStatDefinition(statId: string): DerivedStatDefinition | undefined {
    return this.config.derivedStats.find((s) => s.id === statId);
  }

  /**
   * Check if a stat value is within valid range
   */
  isValidStatValue(statId: string, value: number): boolean {
    const def = this.getStatDefinition(statId);
    if (!def) return true;
    return value >= def.minValue && value <= def.maxValue;
  }

  /**
   * Clamp a stat value to valid range
   */
  clampStatValue(statId: string, value: number): number {
    const def = this.getStatDefinition(statId);
    if (!def) return value;
    return Math.min(def.maxValue, Math.max(def.minValue, value));
  }

  /**
   * Get all primary stat definitions
   */
  getPrimaryStats(): StatDefinition[] {
    return this.config.primaryStats;
  }

  /**
   * Get all derived stat definitions
   */
  getDerivedStats(): DerivedStatDefinition[] {
    return this.config.derivedStats;
  }
}

/** Default stat configuration for testing/demo */
export const DEFAULT_STAT_CONFIG: StatEngineConfig = {
  primaryStats: [
    { id: 'Strength', name: 'Strength', abbrev: 'STR', description: 'Physical power', defaultValue: 10, minValue: 1, maxValue: 999 },
    { id: 'Dexterity', name: 'Dexterity', abbrev: 'DEX', description: 'Agility and precision', defaultValue: 10, minValue: 1, maxValue: 999 },
    { id: 'Constitution', name: 'Constitution', abbrev: 'CON', description: 'Health and stamina', defaultValue: 10, minValue: 1, maxValue: 999 },
    { id: 'Intelligence', name: 'Intelligence', abbrev: 'INT', description: 'Magic power', defaultValue: 10, minValue: 1, maxValue: 999 },
    { id: 'Wisdom', name: 'Wisdom', abbrev: 'WIS', description: 'Magic resistance', defaultValue: 10, minValue: 1, maxValue: 999 },
    { id: 'Luck', name: 'Luck', abbrev: 'LCK', description: 'Fortune and criticals', defaultValue: 10, minValue: 1, maxValue: 999 },
  ],
  derivedStats: [
    { id: 'MaxHP', name: 'Max HP', formula: 'Constitution * 10 + Level * 5' },
    { id: 'MaxMP', name: 'Max MP', formula: 'Intelligence * 5 + Wisdom * 3' },
    { id: 'Attack', name: 'Attack', formula: 'Strength * 2 + Dexterity * 0.5' },
    { id: 'Defense', name: 'Defense', formula: 'Constitution * 1.5 + Strength * 0.5' },
    { id: 'MagicPower', name: 'Magic Power', formula: 'Intelligence * 3' },
    { id: 'MagicResist', name: 'Magic Resist', formula: 'Wisdom * 2 + Constitution * 0.5' },
    { id: 'Speed', name: 'Speed', formula: 'Dexterity * 2 + Intelligence * 0.5' },
    { id: 'Evasion', name: 'Evasion', formula: 'Dexterity + Luck * 0.5' },
    { id: 'CritRate', name: 'Crit Rate', formula: '5 + Luck * 0.3 + Dexterity * 0.1' },
  ],
  combatFormulas: {
    physicalDamage: 'Attack * (100 / (100 + EnemyDef))',
    magicDamage: 'MagicPower * (100 / (100 + EnemyRes))',
    criticalCheck: 'CritRate',
    turnOrder: 'Speed + Dexterity * 0.5',
  },
};
