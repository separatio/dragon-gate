/**
 * Action Executor
 * Executes skills and items in combat, handling effects and applying results
 */

import type { GameDefinition } from '../../types/game';
import type { Skill } from '../../types/skills';
import type { Item } from '../../types/items';
import type { ModifierSource } from '../../types/modifiers';
import type { Combatant } from './CombatState';
import { DamageCalculator } from './DamageCalculator';

/**
 * Result of executing an action
 */
export interface ActionResult {
  /** Whether the action succeeded */
  success: boolean;
  /** Message describing what happened */
  message: string;
  /** Individual effects that were applied */
  effects: ActionEffect[];
  /** Whether any target was killed */
  killedTargets: string[];
}

/**
 * A single effect from an action
 */
export interface ActionEffect {
  /** ID of the affected combatant */
  targetId: string;
  /** Type of effect */
  type: 'damage' | 'heal' | 'healMp' | 'buff' | 'debuff' | 'revive';
  /** Numerical value (damage dealt, HP healed, etc.) */
  value: number;
  /** Whether this was a critical hit */
  isCritical?: boolean;
  /** Which stat was affected (for buffs/debuffs) */
  statAffected?: string;
}

/**
 * Action Executor
 *
 * Handles the execution of skills and items during combat.
 * Works with the DamageCalculator for damage/healing calculations
 * and manages buff/debuff application.
 */
export class ActionExecutor {
  private game: GameDefinition;
  private damageCalc: DamageCalculator;

  constructor(game: GameDefinition) {
    this.game = game;
    this.damageCalc = new DamageCalculator(game);
  }

  /**
   * Execute a skill
   *
   * @param actor - The combatant using the skill
   * @param skill - The skill being used
   * @param targets - Target combatants
   * @returns Result of the skill execution
   */
  executeSkill(
    actor: Combatant,
    skill: Skill,
    targets: Combatant[]
  ): ActionResult {
    // Check MP cost
    if (skill.mpCost > actor.currentMp) {
      return {
        success: false,
        message: `Not enough MP! (Need ${skill.mpCost}, have ${actor.currentMp})`,
        effects: [],
        killedTargets: []
      };
    }

    // Check HP cost (for special skills)
    if (skill.hpCost && skill.hpCost >= actor.currentHp) {
      return {
        success: false,
        message: `Not enough HP! (Need ${skill.hpCost}, have ${actor.currentHp})`,
        effects: [],
        killedTargets: []
      };
    }

    // Deduct costs
    actor.currentMp -= skill.mpCost;
    if (skill.hpCost) {
      actor.currentHp -= skill.hpCost;
    }

    const effects: ActionEffect[] = [];
    const killedTargets: string[] = [];
    const message = `${actor.name} uses ${skill.name}!`;

    // Execute based on skill type
    switch (skill.type) {
      case 'physical':
      case 'magic':
        effects.push(...this.executeAttackSkill(actor, skill, targets, killedTargets));
        break;

      case 'healing':
        effects.push(...this.executeHealingSkill(actor, skill, targets));
        break;

      case 'buff':
        effects.push(...this.executeBuffSkill(actor, skill, targets));
        break;

      case 'debuff':
        effects.push(...this.executeDebuffSkill(actor, skill, targets));
        break;

      case 'defense':
        effects.push(...this.executeDefenseSkill(actor, skill));
        break;

      case 'special':
        // Special skills can have mixed effects - handle case by case
        if (skill.buffEffect) {
          effects.push(...this.executeBuffSkill(actor, skill, targets));
        }
        if (skill.debuffEffect) {
          effects.push(...this.executeDebuffSkill(actor, skill, targets));
        }
        if (skill.power && skill.power > 0) {
          effects.push(...this.executeAttackSkill(actor, skill, targets, killedTargets));
        }
        break;
    }

    return { success: true, message, effects, killedTargets };
  }

  /**
   * Execute an attack skill (physical or magic)
   */
  private executeAttackSkill(
    actor: Combatant,
    skill: Skill,
    targets: Combatant[],
    killedTargets: string[]
  ): ActionEffect[] {
    const effects: ActionEffect[] = [];
    const damageType = skill.type === 'magic' ? 'magic' : 'physical';
    const skillPower = skill.power ?? 100;

    for (const target of targets) {
      if (!target.isAlive) continue;

      // Calculate damage
      const damageResult = this.damageCalc.calculate(
        actor,
        target,
        damageType,
        skillPower
      );

      // Apply defense reduction if target is defending
      let finalDamage = damageResult.damage;
      if (target.isDefending) {
        finalDamage = Math.floor(finalDamage * 0.5);
      }

      // Apply damage
      target.currentHp = Math.max(0, target.currentHp - finalDamage);

      // Check if target died
      if (target.currentHp <= 0) {
        target.isAlive = false;
        killedTargets.push(target.id);
      }

      effects.push({
        targetId: target.id,
        type: 'damage',
        value: finalDamage,
        isCritical: damageResult.isCritical
      });
    }

    return effects;
  }

  /**
   * Execute a healing skill
   */
  private executeHealingSkill(
    actor: Combatant,
    skill: Skill,
    targets: Combatant[]
  ): ActionEffect[] {
    const effects: ActionEffect[] = [];
    const basePower = skill.power ?? 50;

    for (const target of targets) {
      if (!target.isAlive) continue;

      // Calculate healing
      const healAmount = this.damageCalc.calculateHealing(actor, basePower);

      const previousHp = target.currentHp;
      target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount);
      const actualHeal = target.currentHp - previousHp;

      effects.push({
        targetId: target.id,
        type: 'heal',
        value: actualHeal
      });
    }

    return effects;
  }

  /**
   * Execute a buff skill
   */
  private executeBuffSkill(
    actor: Combatant,
    skill: Skill,
    targets: Combatant[]
  ): ActionEffect[] {
    const effects: ActionEffect[] = [];

    if (!skill.buffEffect) return effects;

    for (const target of targets) {
      if (!target.isAlive) continue;

      // Add modifier to target
      target.modifiers.addModifier(
        {
          id: `buff_${skill.id}`,
          name: skill.name,
          description: skill.description,
          effects: [{
            stat: skill.buffEffect.stat,
            valueType: skill.buffEffect.type ?? 'flat',
            value: skill.buffEffect.value
          }],
          duration: skill.buffEffect.duration,
          stackable: false
        },
        'buff' as ModifierSource
      );

      effects.push({
        targetId: target.id,
        type: 'buff',
        value: skill.buffEffect.value,
        statAffected: skill.buffEffect.stat
      });
    }

    return effects;
  }

  /**
   * Execute a debuff skill
   */
  private executeDebuffSkill(
    actor: Combatant,
    skill: Skill,
    targets: Combatant[]
  ): ActionEffect[] {
    const effects: ActionEffect[] = [];

    if (!skill.debuffEffect) return effects;

    for (const target of targets) {
      if (!target.isAlive) continue;

      // Add negative modifier to target
      target.modifiers.addModifier(
        {
          id: `debuff_${skill.id}`,
          name: skill.name,
          description: skill.description,
          effects: [{
            stat: skill.debuffEffect.stat,
            valueType: skill.debuffEffect.type ?? 'flat',
            value: -Math.abs(skill.debuffEffect.value) // Ensure negative
          }],
          duration: skill.debuffEffect.duration,
          stackable: false
        },
        'debuff' as ModifierSource
      );

      effects.push({
        targetId: target.id,
        type: 'debuff',
        value: skill.debuffEffect.value,
        statAffected: skill.debuffEffect.stat
      });
    }

    return effects;
  }

  /**
   * Execute a defense skill
   */
  private executeDefenseSkill(
    actor: Combatant,
    skill: Skill
  ): ActionEffect[] {
    // Defense skills set the isDefending flag
    actor.isDefending = true;

    // May also apply a buff
    if (skill.buffEffect) {
      actor.modifiers.addModifier(
        {
          id: `defense_${skill.id}`,
          name: skill.name,
          description: skill.description,
          effects: [{
            stat: skill.buffEffect.stat,
            valueType: skill.buffEffect.type ?? 'flat',
            value: skill.buffEffect.value
          }],
          duration: 1, // Defense buffs usually last 1 turn
          stackable: false
        },
        'buff' as ModifierSource
      );
    }

    return [{
      targetId: actor.id,
      type: 'buff',
      value: skill.value ?? 50,
      statAffected: 'Defense'
    }];
  }

  /**
   * Execute an item
   *
   * @param actor - The combatant using the item
   * @param item - The item being used
   * @param targets - Target combatants
   * @returns Result of the item use
   */
  executeItem(
    actor: Combatant,
    item: Item,
    targets: Combatant[]
  ): ActionResult {
    const effects: ActionEffect[] = [];
    const killedTargets: string[] = [];
    const message = `${actor.name} uses ${item.name}!`;

    switch (item.effect) {
      case 'healHp':
        for (const target of targets) {
          if (!target.isAlive) continue;

          const previousHp = target.currentHp;
          target.currentHp = Math.min(target.maxHp, target.currentHp + item.value);
          const actualHeal = target.currentHp - previousHp;

          effects.push({
            targetId: target.id,
            type: 'heal',
            value: actualHeal
          });
        }
        break;

      case 'healMp':
        for (const target of targets) {
          if (!target.isAlive) continue;

          const previousMp = target.currentMp;
          target.currentMp = Math.min(target.maxMp, target.currentMp + item.value);
          const actualRestore = target.currentMp - previousMp;

          effects.push({
            targetId: target.id,
            type: 'healMp',
            value: actualRestore,
            statAffected: 'MP'
          });
        }
        break;

      case 'revive':
        for (const target of targets) {
          if (target.isAlive) continue; // Only revive dead targets

          target.isAlive = true;
          // Revive with percentage of max HP based on item value
          target.currentHp = Math.floor(target.maxHp * (item.value / 100));

          effects.push({
            targetId: target.id,
            type: 'revive',
            value: target.currentHp
          });
        }
        break;

      case 'buff':
        if (item.buffStat && item.buffValue) {
          for (const target of targets) {
            if (!target.isAlive) continue;

            target.modifiers.addModifier(
              {
                id: `item_${item.id}`,
                name: item.name,
                description: item.description,
                effects: [{
                  stat: item.buffStat,
                  valueType: 'flat',
                  value: item.buffValue
                }],
                duration: item.buffDuration ?? 3,
                stackable: false
              },
              'item' as ModifierSource
            );

            effects.push({
              targetId: target.id,
              type: 'buff',
              value: item.buffValue,
              statAffected: item.buffStat
            });
          }
        }
        break;

      case 'damage':
        // Damage items (bombs, throwables, etc.)
        for (const target of targets) {
          if (!target.isAlive) continue;

          const damage = item.value;
          target.currentHp = Math.max(0, target.currentHp - damage);

          if (target.currentHp <= 0) {
            target.isAlive = false;
            killedTargets.push(target.id);
          }

          effects.push({
            targetId: target.id,
            type: 'damage',
            value: damage
          });
        }
        break;

      case 'cure':
        // Remove negative status effects (placeholder for status system)
        for (const target of targets) {
          if (!target.isAlive) continue;

          // Clear debuffs
          target.modifiers.clearBySource('debuff');

          effects.push({
            targetId: target.id,
            type: 'buff',
            value: 0,
            statAffected: 'status'
          });
        }
        break;

      case 'none':
        // Key items or items with no battle effect
        break;
    }

    return { success: true, message, effects, killedTargets };
  }

  /**
   * Look up a skill by ID from the game definition
   */
  getSkillById(skillId: string): Skill | undefined {
    return this.game.skills?.find(s => s.id === skillId);
  }

  /**
   * Look up an item by ID from the game definition
   */
  getItemById(itemId: string): Item | undefined {
    return this.game.items?.find(i => i.id === itemId);
  }

  /**
   * Get the damage calculator for preview purposes
   */
  getDamageCalculator(): DamageCalculator {
    return this.damageCalc;
  }
}
