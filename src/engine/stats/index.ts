/**
 * Stat Engine Module
 * Provides stat calculation and modifier functionality for Dragon Gate
 */

// Stat Engine
export { StatEngine, DEFAULT_STAT_CONFIG } from './StatEngine';
export type { StatEngineConfig } from './StatEngine';

// Modifier Stack
export { ModifierStack } from './ModifierStack';
export type { ActiveModifierState } from './ModifierStack';

// Modifier Utilities
export {
  createFlatModifier,
  createPercentModifier,
  createEquipmentModifier,
  createStackableBuff,
  createStackableDebuff,
  mergeEffects,
  applyEffect,
} from './modifierUtils';
