/**
 * Modifier Stack
 * Manages and applies stat modifiers (buffs, debuffs, equipment bonuses)
 *
 * Formula: FinalStat = (BaseStat + ΣFlatBonuses) × (1 + Σ%Bonuses/100)
 */

import type { ModifierDefinition, ModifierSource } from '../../types/modifiers';
import type { StatBlock } from '../../types/stats';

/** Runtime state for an active modifier */
export interface ActiveModifierState {
  /** The modifier definition */
  definition: ModifierDefinition;
  /** Source type (equipment, buff, etc.) */
  sourceType: ModifierSource;
  /** Current stack count */
  currentStacks: number;
  /** Remaining duration in turns (undefined = permanent) */
  remainingDuration?: number;
}

/**
 * ModifierStack class
 * Manages a collection of active modifiers and applies them to stats
 */
export class ModifierStack {
  private modifiers: Map<string, ActiveModifierState> = new Map();

  /**
   * Add a modifier to the stack
   * @param definition - The modifier definition
   * @param sourceType - Source type (equipment, buff, debuff, etc.)
   */
  addModifier(definition: ModifierDefinition, sourceType: ModifierSource): void {
    const existing = this.modifiers.get(definition.id);

    if (existing && definition.stackable) {
      // Stack the modifier
      const maxStacks = definition.maxStacks ?? Infinity;
      existing.currentStacks = Math.min(existing.currentStacks + 1, maxStacks);
      // Refresh duration on stack
      if (definition.duration !== undefined) {
        existing.remainingDuration = definition.duration;
      }
    } else if (!existing) {
      // Add new modifier
      const state: ActiveModifierState = {
        definition,
        sourceType,
        currentStacks: 1,
        remainingDuration: definition.duration,
      };
      this.modifiers.set(definition.id, state);
    }
    // If not stackable and already exists, ignore
  }

  /**
   * Remove a modifier from the stack entirely
   */
  removeModifier(modifierId: string): void {
    this.modifiers.delete(modifierId);
  }

  /**
   * Remove one stack of a modifier
   */
  removeStack(modifierId: string): void {
    const state = this.modifiers.get(modifierId);
    if (state) {
      state.currentStacks--;
      if (state.currentStacks <= 0) {
        this.modifiers.delete(modifierId);
      }
    }
  }

  /**
   * Tick duration for all modifiers (call once per turn)
   * @returns List of expired modifier IDs
   */
  tickDuration(): string[] {
    const expired: string[] = [];

    for (const [id, state] of this.modifiers) {
      if (state.remainingDuration !== undefined) {
        state.remainingDuration--;
        if (state.remainingDuration <= 0) {
          expired.push(id);
          this.modifiers.delete(id);
        }
      }
    }

    return expired;
  }

  /**
   * Get all active modifier states
   */
  getActiveModifiers(): ActiveModifierState[] {
    return Array.from(this.modifiers.values());
  }

  /**
   * Get modifiers by source type
   */
  getModifiersBySource(sourceType: ModifierSource): ActiveModifierState[] {
    return this.getActiveModifiers().filter((m) => m.sourceType === sourceType);
  }

  /**
   * Check if a modifier is active
   */
  hasModifier(modifierId: string): boolean {
    return this.modifiers.has(modifierId);
  }

  /**
   * Get stack count for a modifier
   */
  getStackCount(modifierId: string): number {
    return this.modifiers.get(modifierId)?.currentStacks ?? 0;
  }

  /**
   * Get remaining duration for a modifier
   */
  getRemainingDuration(modifierId: string): number | undefined {
    return this.modifiers.get(modifierId)?.remainingDuration;
  }

  /**
   * Apply all modifiers to a stat block
   * Formula: (base + flat) × (1 + percent/100)
   * @returns Modified stats (does not mutate original)
   */
  applyToStats(baseStats: StatBlock): StatBlock {
    const result: StatBlock = { ...baseStats };

    // Collect all effects by stat
    const flatBonuses: Record<string, number> = {};
    const percentBonuses: Record<string, number> = {};

    for (const state of this.modifiers.values()) {
      const multiplier = state.currentStacks;

      for (const effect of state.definition.effects) {
        if (effect.valueType === 'flat') {
          flatBonuses[effect.stat] = (flatBonuses[effect.stat] ?? 0) + effect.value * multiplier;
        } else {
          percentBonuses[effect.stat] =
            (percentBonuses[effect.stat] ?? 0) + effect.value * multiplier;
        }
      }
    }

    // Apply in order: flat first, then percent
    for (const stat of Object.keys(result)) {
      const base = result[stat];
      const flat = flatBonuses[stat] ?? 0;
      const percent = percentBonuses[stat] ?? 0;

      // Formula: (base + flat) * (1 + percent/100)
      result[stat] = Math.floor((base + flat) * (1 + percent / 100));
    }

    return result;
  }

  /**
   * Calculate the total bonus for a specific stat
   */
  getStatBonus(
    stat: string,
    baseValue: number
  ): { flat: number; percent: number; final: number } {
    let flat = 0;
    let percent = 0;

    for (const state of this.modifiers.values()) {
      const multiplier = state.currentStacks;

      for (const effect of state.definition.effects) {
        if (effect.stat === stat) {
          if (effect.valueType === 'flat') {
            flat += effect.value * multiplier;
          } else {
            percent += effect.value * multiplier;
          }
        }
      }
    }

    const final = Math.floor((baseValue + flat) * (1 + percent / 100));
    return { flat, percent, final };
  }

  /**
   * Clear all modifiers
   */
  clear(): void {
    this.modifiers.clear();
  }

  /**
   * Clear modifiers by source type (e.g., clear all buffs at battle end)
   */
  clearBySource(sourceType: ModifierSource): void {
    for (const [id, state] of this.modifiers) {
      if (state.sourceType === sourceType) {
        this.modifiers.delete(id);
      }
    }
  }

  /**
   * Serialize for save game
   */
  toJSON(): Array<{ id: string; sourceType: ModifierSource; stacks: number; duration?: number }> {
    return Array.from(this.modifiers.values()).map((state) => ({
      id: state.definition.id,
      sourceType: state.sourceType,
      stacks: state.currentStacks,
      duration: state.remainingDuration,
    }));
  }

  /**
   * Restore from save game (requires modifier definitions lookup)
   */
  static fromJSON(
    data: Array<{ id: string; sourceType: ModifierSource; stacks: number; duration?: number }>,
    definitionLookup: (id: string) => ModifierDefinition | undefined
  ): ModifierStack {
    const stack = new ModifierStack();

    for (const saved of data) {
      const definition = definitionLookup(saved.id);
      if (definition) {
        stack.modifiers.set(saved.id, {
          definition,
          sourceType: saved.sourceType,
          currentStacks: saved.stacks,
          remainingDuration: saved.duration,
        });
      }
    }

    return stack;
  }
}
