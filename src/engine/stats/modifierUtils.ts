/**
 * Modifier Utilities
 * Helper functions for creating common modifier types
 */

import type { ModifierDefinition, ModifierEffect } from '../../types/modifiers';

/**
 * Create a simple flat bonus modifier
 */
export function createFlatModifier(
  id: string,
  name: string,
  stat: string,
  value: number,
  duration?: number
): ModifierDefinition {
  return {
    id,
    name,
    description: `+${value} ${stat}`,
    effects: [{ stat, valueType: 'flat', value }],
    duration,
    stackable: false,
  };
}

/**
 * Create a simple percent bonus modifier
 */
export function createPercentModifier(
  id: string,
  name: string,
  stat: string,
  value: number,
  duration?: number
): ModifierDefinition {
  return {
    id,
    name,
    description: `+${value}% ${stat}`,
    effects: [{ stat, valueType: 'percent', value }],
    duration,
    stackable: false,
  };
}

/**
 * Create a multi-stat modifier (like equipment)
 */
export function createEquipmentModifier(
  id: string,
  name: string,
  effects: Array<{ stat: string; value: number; isPercent?: boolean }>
): ModifierDefinition {
  return {
    id,
    name,
    description: effects
      .map((e) => `${e.isPercent ? '+' + e.value + '%' : '+' + e.value} ${e.stat}`)
      .join(', '),
    effects: effects.map((e) => ({
      stat: e.stat,
      valueType: e.isPercent ? 'percent' : 'flat',
      value: e.value,
    })),
    stackable: false,
  };
}

/**
 * Create a stackable buff
 */
export function createStackableBuff(
  id: string,
  name: string,
  stat: string,
  valuePerStack: number,
  maxStacks: number,
  duration: number
): ModifierDefinition {
  return {
    id,
    name,
    description: `+${valuePerStack} ${stat} per stack (max ${maxStacks})`,
    effects: [{ stat, valueType: 'flat', value: valuePerStack }],
    duration,
    stackable: true,
    maxStacks,
  };
}

/**
 * Create a stackable debuff
 */
export function createStackableDebuff(
  id: string,
  name: string,
  stat: string,
  valuePerStack: number,
  maxStacks: number,
  duration: number
): ModifierDefinition {
  return {
    id,
    name,
    description: `-${Math.abs(valuePerStack)} ${stat} per stack (max ${maxStacks})`,
    effects: [{ stat, valueType: 'flat', value: -Math.abs(valuePerStack) }],
    duration,
    stackable: true,
    maxStacks,
  };
}

/**
 * Merge multiple effect arrays (for combining modifiers)
 */
export function mergeEffects(effectArrays: ModifierEffect[][]): ModifierEffect[] {
  const merged: Record<string, { flat: number; percent: number }> = {};

  for (const effects of effectArrays) {
    for (const effect of effects) {
      if (!merged[effect.stat]) {
        merged[effect.stat] = { flat: 0, percent: 0 };
      }
      if (effect.valueType === 'flat') {
        merged[effect.stat].flat += effect.value;
      } else {
        merged[effect.stat].percent += effect.value;
      }
    }
  }

  const result: ModifierEffect[] = [];
  for (const [stat, values] of Object.entries(merged)) {
    if (values.flat !== 0) {
      result.push({ stat, valueType: 'flat', value: values.flat });
    }
    if (values.percent !== 0) {
      result.push({ stat, valueType: 'percent', value: values.percent });
    }
  }

  return result;
}

/**
 * Calculate the effective value after applying a single effect
 */
export function applyEffect(baseValue: number, effect: ModifierEffect): number {
  if (effect.valueType === 'flat') {
    return baseValue + effect.value;
  }
  return baseValue * (1 + effect.value / 100);
}
