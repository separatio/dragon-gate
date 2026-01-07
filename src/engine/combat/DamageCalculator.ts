/**
 * Damage Calculator
 * Calculates damage using game-defined formulas from the stat system
 */

import type { GameDefinition } from '../../types/game';
import type { Combatant } from './CombatState';
import { formulaParser } from '../formula';

/**
 * Result of a damage calculation
 */
export interface DamageResult {
  /** Final damage after all calculations */
  damage: number;
  /** Whether this was a critical hit */
  isCritical: boolean;
  /** Raw damage before defense mitigation */
  rawDamage: number;
  /** Amount of damage mitigated by defense */
  mitigatedBy: number;
}

/**
 * Context variables available to damage formulas
 * Extends with index signature for formula parser compatibility
 */
export interface DamageContext {
  // Index signature for formula parser
  [key: string]: number;

  // Attacker stats (from currentStats)
  Attack: number;
  MagicPower: number;
  Strength: number;
  Intelligence: number;
  Dexterity: number;
  Luck: number;
  CritRate: number;
  CritDamage: number;
  Speed: number;

  // Defender stats (prefixed with Enemy)
  EnemyDef: number;
  EnemyRes: number;
  EnemyDefense: number;
  EnemyMagicResist: number;

  // Combat modifiers
  SkillPower: number;
  Variance: number;
  IsCritical: number;
  Random: number;
  Level: number;
}

/**
 * Damage Calculator
 *
 * Uses the game's stat system formulas to calculate physical and magic damage.
 * Supports critical hits, variance, and skill power scaling.
 */
export class DamageCalculator {
  private formulas: {
    physicalDamage: string;
    magicDamage: string;
    criticalCheck: string;
  };

  constructor(game: GameDefinition) {
    // Use game-defined formulas or sensible defaults
    const combatFormulas = game.stats?.combatFormulas;

    this.formulas = {
      physicalDamage: combatFormulas?.physicalDamage ??
        'Attack * SkillPower / 100 * (100 / (100 + EnemyDef)) * (1 + Variance * 0.1)',

      magicDamage: combatFormulas?.magicDamage ??
        'MagicPower * SkillPower / 100 * (100 / (100 + EnemyRes)) * (1 + Variance * 0.1)',

      criticalCheck: combatFormulas?.criticalCheck ?? 'CritRate'
    };
  }

  /**
   * Calculate damage from attacker to defender
   *
   * @param attacker - The attacking combatant
   * @param defender - The defending combatant
   * @param damageType - Physical or magic damage
   * @param skillPower - Base power of the skill (100 = normal attack)
   * @returns Calculated damage result
   */
  calculate(
    attacker: Combatant,
    defender: Combatant,
    damageType: 'physical' | 'magic',
    skillPower: number = 100
  ): DamageResult {
    // Generate random values
    const variance = Math.random() * 2 - 1; // -1 to 1
    const critRoll = Math.random() * 100;

    // Build context from combatant stats
    const context = this.buildContext(attacker, defender, skillPower, variance, critRoll);

    // Check for critical hit
    const isCritical = this.checkCritical(context, critRoll);
    context.IsCritical = isCritical ? 1 : 0;

    // Calculate base damage using appropriate formula
    let rawDamage: number;
    const formula = damageType === 'physical'
      ? this.formulas.physicalDamage
      : this.formulas.magicDamage;

    try {
      rawDamage = formulaParser.compute(formula, context);
    } catch {
      // Fallback to simple calculation if formula fails
      if (damageType === 'physical') {
        rawDamage = context.Attack * (100 / (100 + context.EnemyDef)) * skillPower / 100;
      } else {
        rawDamage = context.MagicPower * (100 / (100 + context.EnemyRes)) * skillPower / 100;
      }
    }

    // Apply critical multiplier
    if (isCritical) {
      const critMultiplier = (context.CritDamage || 150) / 100;
      rawDamage *= critMultiplier;
    }

    // Ensure minimum damage of 1
    const finalDamage = Math.max(1, Math.floor(rawDamage));

    // Calculate mitigation for display
    const baseAttack = damageType === 'physical' ? context.Attack : context.MagicPower;
    const mitigatedBy = Math.max(0, Math.floor(baseAttack * skillPower / 100) - finalDamage);

    return {
      damage: finalDamage,
      isCritical,
      rawDamage: Math.floor(rawDamage),
      mitigatedBy
    };
  }

  /**
   * Check if an attack is a critical hit
   */
  private checkCritical(context: DamageContext, critRoll: number): boolean {
    try {
      // The criticalCheck formula should return a crit rate percentage
      const critRate = formulaParser.compute(this.formulas.criticalCheck, context);
      return critRoll < critRate;
    } catch {
      // Fallback: simple percentage check
      return critRoll < (context.CritRate || 5);
    }
  }

  /**
   * Build context object from combatants for formula evaluation
   */
  private buildContext(
    attacker: Combatant,
    defender: Combatant,
    skillPower: number,
    variance: number,
    randomValue: number
  ): DamageContext {
    const aStats = attacker.currentStats;
    const dStats = defender.currentStats;

    return {
      // Attacker stats (try multiple naming conventions)
      Attack: aStats.Attack ?? aStats.attack ?? aStats.physAtk ?? 10,
      MagicPower: aStats.MagicPower ?? aStats.magicPower ?? aStats.magAtk ?? 10,
      Strength: aStats.Strength ?? aStats.strength ?? aStats.str ?? 10,
      Intelligence: aStats.Intelligence ?? aStats.intelligence ?? aStats.int ?? 10,
      Dexterity: aStats.Dexterity ?? aStats.dexterity ?? aStats.dex ?? 10,
      Luck: aStats.Luck ?? aStats.luck ?? aStats.lck ?? 10,
      CritRate: aStats.CritRate ?? aStats.critRate ?? 5,
      CritDamage: aStats.CritDamage ?? aStats.critDamage ?? aStats.critDmg ?? 150,
      Speed: aStats.Speed ?? aStats.speed ?? 10,
      Level: attacker.level ?? 1,

      // Defender stats (for Enemy* variables in formulas)
      EnemyDef: dStats.Defense ?? dStats.defense ?? dStats.physDef ?? 10,
      EnemyRes: dStats.MagicResist ?? dStats.magicResist ?? dStats.magDef ?? 10,
      EnemyDefense: dStats.Defense ?? dStats.defense ?? dStats.physDef ?? 10,
      EnemyMagicResist: dStats.MagicResist ?? dStats.magicResist ?? dStats.magDef ?? 10,

      // Combat values
      SkillPower: skillPower,
      Variance: variance,
      IsCritical: 0,
      Random: randomValue
    };
  }

  /**
   * Calculate healing amount
   *
   * @param healer - The combatant doing the healing
   * @param basePower - Base power of the healing skill
   * @returns Amount of HP to restore
   */
  calculateHealing(healer: Combatant, basePower: number): number {
    const magAtk = healer.currentStats.MagicPower ??
                   healer.currentStats.magicPower ??
                   healer.currentStats.Intelligence ??
                   healer.currentStats.intelligence ??
                   10;
    const variance = 0.9 + Math.random() * 0.2; // 90-110%

    return Math.floor((basePower + magAtk * 0.5) * variance);
  }

  /**
   * Preview damage range without randomness (for UI)
   *
   * @param attacker - The attacking combatant
   * @param defender - The defending combatant
   * @param damageType - Physical or magic
   * @param skillPower - Skill power
   * @returns Min, max, and average (with crit) damage
   */
  previewDamage(
    attacker: Combatant,
    defender: Combatant,
    damageType: 'physical' | 'magic',
    skillPower: number = 100
  ): { min: number; max: number; avgCrit: number } {
    const formula = damageType === 'physical'
      ? this.formulas.physicalDamage
      : this.formulas.magicDamage;

    // Calculate with variance extremes
    const contextMin = this.buildContext(attacker, defender, skillPower, -1, 0);
    const contextMax = this.buildContext(attacker, defender, skillPower, 1, 0);

    let minDamage: number;
    let maxDamage: number;

    try {
      minDamage = Math.max(1, Math.floor(formulaParser.compute(formula, contextMin)));
      maxDamage = Math.max(1, Math.floor(formulaParser.compute(formula, contextMax)));
    } catch {
      // Fallback
      const attack = damageType === 'physical' ? contextMin.Attack : contextMin.MagicPower;
      const defense = damageType === 'physical' ? contextMin.EnemyDef : contextMin.EnemyRes;
      const base = attack * (100 / (100 + defense)) * skillPower / 100;
      minDamage = Math.max(1, Math.floor(base * 0.9));
      maxDamage = Math.max(1, Math.floor(base * 1.1));
    }

    // Average with crit consideration
    const avgBase = (minDamage + maxDamage) / 2;
    const critRate = (contextMin.CritRate || 5) / 100;
    const critMult = (contextMin.CritDamage || 150) / 100;
    const avgCrit = Math.floor(avgBase * (1 - critRate) + avgBase * critMult * critRate);

    return { min: minDamage, max: maxDamage, avgCrit };
  }
}
