/**
 * Choice Evaluator
 * Evaluates choice conditions, requirements, and visibility
 */

import type { Choice, ChoiceRequirements, GameDefinition, Character } from '../types';
import { StoryVariables } from '../stores/storyVariables';
import { FormulaParser } from './formula';

export interface EvaluatedChoice extends Choice {
  available: boolean;
  reason?: string;
}

export class ChoiceEvaluator {
  private parser: FormulaParser;
  private game: GameDefinition;

  constructor(game: GameDefinition) {
    this.game = game;
    this.parser = new FormulaParser();
  }

  /**
   * Evaluate an array of choices for a character
   * Returns choices with availability status and reasons
   */
  evaluateChoices(choices: Choice[], character: Character): EvaluatedChoice[] {
    return choices
      .map((choice) => this.evaluateChoice(choice, character))
      .filter((choice) => choice.reason !== 'hidden');
  }

  /**
   * Evaluate a single choice
   */
  private evaluateChoice(choice: Choice, character: Character): EvaluatedChoice {
    // Check visibility condition first (showIf)
    if (choice.showIf && !this.evaluateCondition(choice.showIf, character)) {
      return { ...choice, available: false, reason: 'hidden' };
    }

    // Check requirements
    if (choice.requires) {
      const requirementCheck = this.checkRequirements(choice.requires, character);
      if (!requirementCheck.met) {
        return { ...choice, available: false, reason: requirementCheck.reason };
      }
    }

    // Check condition (legacy support)
    if (choice.condition && !this.evaluateSimpleCondition(choice.condition)) {
      return { ...choice, available: false, reason: 'condition not met' };
    }

    return { ...choice, available: true };
  }

  /**
   * Evaluate a formula condition
   */
  private evaluateCondition(condition: string, character: Character): boolean {
    const context = this.buildContext(character);

    try {
      const result = this.parser.compute(condition, context);
      return Boolean(result);
    } catch {
      console.warn(`Failed to evaluate condition: ${condition}`);
      return true; // Default to available if condition fails
    }
  }

  /**
   * Evaluate a simple string condition (legacy format)
   * Format: "variable operator value" e.g., "hasKey == true"
   */
  private evaluateSimpleCondition(condition: string): boolean {
    const parts = condition.split(/\s+/);
    if (parts.length !== 3) return true;

    const [varName, operator, value] = parts;
    const varValue = StoryVariables.get(varName);

    switch (operator) {
      case '==':
        return String(varValue) === value;
      case '!=':
        return String(varValue) !== value;
      case '>':
        return Number(varValue) > Number(value);
      case '<':
        return Number(varValue) < Number(value);
      case '>=':
        return Number(varValue) >= Number(value);
      case '<=':
        return Number(varValue) <= Number(value);
      default:
        return true;
    }
  }

  /**
   * Check structured requirements
   */
  private checkRequirements(
    requires: ChoiceRequirements,
    character: Character
  ): { met: boolean; reason?: string } {
    // Check stat requirements
    if (requires.stats) {
      for (const [statId, minValue] of Object.entries(requires.stats)) {
        const currentValue = character.currentStats?.[statId] ?? character.baseStats[statId] ?? 0;
        if (currentValue < minValue) {
          const statName = this.getStatName(statId);
          return {
            met: false,
            reason: `Requires ${statName} ${minValue} (current: ${currentValue})`,
          };
        }
      }
    }

    // Check item requirements
    if (requires.items) {
      for (const itemReq of requires.items) {
        const hasItem = this.checkInventory(character, itemReq.id, itemReq.count ?? 1);
        if (!hasItem) {
          const itemName = this.getItemName(itemReq.id);
          return {
            met: false,
            reason: `Requires ${itemReq.count ?? 1}x ${itemName}`,
          };
        }
      }
    }

    // Check flag requirements
    if (requires.flags) {
      for (const [flag, expectedValue] of Object.entries(requires.flags)) {
        const actualValue = StoryVariables.get(flag);
        if (actualValue !== expectedValue) {
          return {
            met: false,
            reason: `Requires ${flag}`,
          };
        }
      }
    }

    // Check skill requirements
    if (requires.skills) {
      for (const skillId of requires.skills) {
        const hasSkill = character.skills?.includes(skillId) ?? false;
        if (!hasSkill) {
          const skillName = this.getSkillName(skillId);
          return {
            met: false,
            reason: `Requires skill: ${skillName}`,
          };
        }
      }
    }

    return { met: true };
  }

  /**
   * Check if character has required items in inventory
   */
  private checkInventory(character: Character, itemId: string, count: number): boolean {
    const inventory = character.inventory ?? [];
    const item = inventory.find((i) => i.id === itemId);
    return item ? item.count >= count : false;
  }

  /**
   * Build formula context from character stats
   */
  private buildContext(character: Character): Record<string, number> {
    const context: Record<string, number> = {};

    // Add base stats
    if (character.baseStats) {
      for (const [key, value] of Object.entries(character.baseStats)) {
        context[key] = value;
      }
    }

    // Add current/computed stats (override base)
    if (character.currentStats) {
      for (const [key, value] of Object.entries(character.currentStats)) {
        context[key] = value;
      }
    }

    // Add common variables
    context.hp = character.currentHp ?? context.maxHp ?? 100;
    context.maxHp = context.maxHp ?? 100;
    context.mp = character.currentMp ?? context.maxMp ?? 50;
    context.maxMp = context.maxMp ?? 50;
    context.level = character.level ?? 1;

    // Add story variables as numbers where applicable
    const allVars = StoryVariables.getAll();
    for (const [key, value] of Object.entries(allVars)) {
      if (typeof value === 'number') {
        context[`var_${key}`] = value;
      } else if (typeof value === 'boolean') {
        context[`var_${key}`] = value ? 1 : 0;
      }
    }

    return context;
  }

  /**
   * Get display name for a stat
   */
  private getStatName(statId: string): string {
    const stat = this.game.stats.primary.find((s) => s.id === statId);
    return stat?.name ?? statId;
  }

  /**
   * Get display name for an item
   */
  private getItemName(itemId: string): string {
    const item = this.game.items.find((i) => i.id === itemId);
    return item?.name ?? itemId;
  }

  /**
   * Get display name for a skill
   */
  private getSkillName(skillId: string): string {
    const skill = this.game.skills.find((s) => s.id === skillId);
    return skill?.name ?? skillId;
  }
}
