/**
 * Enemy AI
 * Decision-making system for enemy combatants with different behavior patterns
 */

import type { GameDefinition } from '../../types/game';
import type { Skill } from '../../types/skills';
import type { EnemyAIConfig } from '../../types/character';
import type { Combatant, CombatAction, CombatSnapshot } from './CombatState';

/**
 * Default AI configuration values
 */
const DEFAULT_AI_CONFIG: Required<EnemyAIConfig> = {
  behavior: 'balanced',
  healThreshold: 30,
  defendThreshold: 20,
  preferTargets: 'random',
  skillPriority: []
};

/**
 * Enemy AI Class
 *
 * Implements different AI behavior patterns for enemy combatants:
 * - aggressive: Always attack with strongest skills
 * - defensive: Heal when low, defend when critical
 * - balanced: Mix of offense, defense, buffs, debuffs
 * - random: Random valid action selection
 * - scripted: Turn-based pattern execution
 */
export class EnemyAI {
  private game: GameDefinition;

  constructor(game: GameDefinition) {
    this.game = game;
  }

  /**
   * Select an action for an enemy combatant
   *
   * @param enemy - The enemy combatant
   * @param snapshot - Current combat state snapshot
   * @param aiConfig - Optional AI configuration (from enemy definition)
   * @returns Combat action to execute
   */
  selectAction(
    enemy: Combatant,
    snapshot: CombatSnapshot,
    aiConfig?: EnemyAIConfig
  ): CombatAction {
    const config: Required<EnemyAIConfig> = {
      ...DEFAULT_AI_CONFIG,
      ...aiConfig
    };

    // Get valid player targets
    const players = Array.from(snapshot.combatants.values())
      .filter(c => c.isPlayer && c.isAlive);

    if (players.length === 0) {
      // No valid targets, defend
      return { type: 'defend', actorId: enemy.id };
    }

    // Get available skills from game definition
    const skills = this.getAvailableSkills(enemy);

    // Select action based on behavior pattern
    switch (config.behavior) {
      case 'aggressive':
        return this.aggressiveBehavior(enemy, skills, players, config);

      case 'defensive':
        return this.defensiveBehavior(enemy, skills, players, config);

      case 'balanced':
        return this.balancedBehavior(enemy, skills, players, config);

      case 'random':
        return this.randomBehavior(enemy, skills, players);

      case 'scripted':
        return this.scriptedBehavior(enemy, skills, players, snapshot, config);

      default:
        return this.randomBehavior(enemy, skills, players);
    }
  }

  /**
   * Get skills available to the enemy from game definition
   */
  private getAvailableSkills(enemy: Combatant): Skill[] {
    return enemy.skills
      .map(id => this.game.skills?.find(s => s.id === id))
      .filter((s): s is Skill => s !== undefined);
  }

  /**
   * Aggressive behavior: Always attack with strongest available skill
   */
  private aggressiveBehavior(
    enemy: Combatant,
    skills: Skill[],
    targets: Combatant[],
    config: Required<EnemyAIConfig>
  ): CombatAction {
    // Filter to attack skills only
    const attackSkills = skills.filter(s =>
      s.type === 'physical' || s.type === 'magic'
    );

    if (attackSkills.length === 0) {
      return { type: 'defend', actorId: enemy.id };
    }

    // Sort by power descending (strongest first)
    attackSkills.sort((a, b) => (b.power ?? 0) - (a.power ?? 0));

    // Find highest power skill the enemy can afford
    const skill = attackSkills.find(s => s.mpCost <= enemy.currentMp);

    if (!skill) {
      // No affordable skills, basic attack
      return this.basicAttack(enemy, targets, 'weakest');
    }

    // Target based on config (defaults to weakest for aggressive)
    const target = this.selectTarget(
      targets,
      config.preferTargets === 'random' ? 'weakest' : config.preferTargets
    );

    return {
      type: 'skill',
      actorId: enemy.id,
      skillId: skill.id,
      targetIds: this.getTargetIds(skill, target, targets)
    };
  }

  /**
   * Defensive behavior: Prioritize survival
   */
  private defensiveBehavior(
    enemy: Combatant,
    skills: Skill[],
    targets: Combatant[],
    config: Required<EnemyAIConfig>
  ): CombatAction {
    const hpPercent = (enemy.currentHp / enemy.maxHp) * 100;

    // Check if should heal
    if (hpPercent <= config.healThreshold) {
      const healSkill = skills.find(s =>
        s.type === 'healing' && s.mpCost <= enemy.currentMp
      );
      if (healSkill) {
        return {
          type: 'skill',
          actorId: enemy.id,
          skillId: healSkill.id,
          targetIds: [enemy.id]
        };
      }
    }

    // Check if should defend
    if (hpPercent <= config.defendThreshold) {
      return { type: 'defend', actorId: enemy.id };
    }

    // Use weakest attack to conserve MP
    const attackSkills = skills
      .filter(s =>
        (s.type === 'physical' || s.type === 'magic') &&
        s.mpCost <= enemy.currentMp
      )
      .sort((a, b) => (a.power ?? 0) - (b.power ?? 0)); // Weakest first

    if (attackSkills.length > 0) {
      const target = this.selectTarget(targets, config.preferTargets);
      return {
        type: 'skill',
        actorId: enemy.id,
        skillId: attackSkills[0].id,
        targetIds: this.getTargetIds(attackSkills[0], target, targets)
      };
    }

    return { type: 'defend', actorId: enemy.id };
  }

  /**
   * Balanced behavior: Mix of strategies based on situation
   */
  private balancedBehavior(
    enemy: Combatant,
    skills: Skill[],
    targets: Combatant[],
    config: Required<EnemyAIConfig>
  ): CombatAction {
    const hpPercent = (enemy.currentHp / enemy.maxHp) * 100;

    // Heal if low HP
    if (hpPercent <= config.healThreshold) {
      const healSkill = skills.find(s =>
        s.type === 'healing' && s.mpCost <= enemy.currentMp
      );
      if (healSkill) {
        return {
          type: 'skill',
          actorId: enemy.id,
          skillId: healSkill.id,
          targetIds: [enemy.id]
        };
      }
    }

    // 30% chance to buff self
    const buffSkill = skills.find(s =>
      s.type === 'buff' && s.mpCost <= enemy.currentMp
    );
    if (buffSkill && Math.random() < 0.3) {
      return {
        type: 'skill',
        actorId: enemy.id,
        skillId: buffSkill.id,
        targetIds: [enemy.id]
      };
    }

    // 20% chance to debuff strongest player
    const debuffSkill = skills.find(s =>
      s.type === 'debuff' && s.mpCost <= enemy.currentMp
    );
    if (debuffSkill && Math.random() < 0.2) {
      const target = this.selectTarget(targets, 'strongest');
      return {
        type: 'skill',
        actorId: enemy.id,
        skillId: debuffSkill.id,
        targetIds: [target.id]
      };
    }

    // Default to attack
    const attackSkills = skills.filter(s =>
      (s.type === 'physical' || s.type === 'magic') &&
      s.mpCost <= enemy.currentMp
    );

    if (attackSkills.length > 0) {
      // Random attack skill
      const skill = attackSkills[Math.floor(Math.random() * attackSkills.length)];
      const target = this.selectTarget(targets, config.preferTargets);
      return {
        type: 'skill',
        actorId: enemy.id,
        skillId: skill.id,
        targetIds: this.getTargetIds(skill, target, targets)
      };
    }

    return { type: 'defend', actorId: enemy.id };
  }

  /**
   * Random behavior: Completely random valid action
   */
  private randomBehavior(
    enemy: Combatant,
    skills: Skill[],
    targets: Combatant[]
  ): CombatAction {
    const affordableSkills = skills.filter(s => s.mpCost <= enemy.currentMp);

    if (affordableSkills.length === 0) {
      return { type: 'defend', actorId: enemy.id };
    }

    const skill = affordableSkills[Math.floor(Math.random() * affordableSkills.length)];
    const target = this.selectTarget(targets, 'random');

    return {
      type: 'skill',
      actorId: enemy.id,
      skillId: skill.id,
      targetIds: this.getTargetIds(skill, target, targets)
    };
  }

  /**
   * Scripted behavior: Follow a turn-based pattern
   */
  private scriptedBehavior(
    enemy: Combatant,
    skills: Skill[],
    targets: Combatant[],
    snapshot: CombatSnapshot,
    config: Required<EnemyAIConfig>
  ): CombatAction {
    // Use skill priority if defined
    if (config.skillPriority.length > 0) {
      const turnIndex = snapshot.turnNumber % config.skillPriority.length;
      const prioritySkillId = config.skillPriority[turnIndex];
      const prioritySkill = skills.find(s =>
        s.id === prioritySkillId && s.mpCost <= enemy.currentMp
      );

      if (prioritySkill) {
        const target = this.selectTarget(targets, config.preferTargets);
        return {
          type: 'skill',
          actorId: enemy.id,
          skillId: prioritySkill.id,
          targetIds: this.getTargetIds(prioritySkill, target, targets)
        };
      }
    }

    // Turn-based pattern: buff on turn 0, attack on others
    const turnMod = snapshot.turnNumber % 3;

    if (turnMod === 0) {
      const buffSkill = skills.find(s =>
        s.type === 'buff' && s.mpCost <= enemy.currentMp
      );
      if (buffSkill) {
        return {
          type: 'skill',
          actorId: enemy.id,
          skillId: buffSkill.id,
          targetIds: [enemy.id]
        };
      }
    }

    // Fallback to balanced behavior
    return this.balancedBehavior(enemy, skills, targets, config);
  }

  /**
   * Select a target based on preference
   */
  private selectTarget(
    targets: Combatant[],
    preference: 'weakest' | 'strongest' | 'random'
  ): Combatant {
    if (targets.length === 0) {
      throw new Error('No valid targets');
    }

    switch (preference) {
      case 'weakest':
        return targets.reduce((weakest, current) =>
          current.currentHp < weakest.currentHp ? current : weakest
        );

      case 'strongest':
        return targets.reduce((strongest, current) =>
          current.currentHp > strongest.currentHp ? current : strongest
        );

      case 'random':
      default:
        return targets[Math.floor(Math.random() * targets.length)];
    }
  }

  /**
   * Get target IDs based on skill targeting type
   */
  private getTargetIds(
    skill: Skill,
    primaryTarget: Combatant,
    allTargets: Combatant[]
  ): string[] {
    // Self-targeting skills
    if (skill.type === 'healing' || skill.type === 'buff' || skill.target === 'self') {
      return [primaryTarget.id]; // Will be overridden by caller for self-buffs
    }

    // AoE skills
    if (skill.target === 'all') {
      return allTargets.map(t => t.id);
    }

    // Single target (default)
    return [primaryTarget.id];
  }

  /**
   * Fallback basic attack when no skills available
   */
  private basicAttack(
    enemy: Combatant,
    targets: Combatant[],
    preference: 'weakest' | 'strongest' | 'random'
  ): CombatAction {
    const target = this.selectTarget(targets, preference);
    return {
      type: 'skill',
      actorId: enemy.id,
      skillId: 'basic_attack', // Handled as fallback in ActionExecutor
      targetIds: [target.id]
    };
  }
}
