/**
 * Hooks barrel exports
 */

export { useGame } from './useGame';
export { useGameLoader } from './useGameLoader';
export { useSceneEngine } from './useSceneEngine';
export { useTextAnimation } from './useTextAnimation';
export { useChoiceEvaluator } from './useChoiceEvaluator';
export { useCombat } from './useCombat';
export type { UseCombatReturn } from './useCombat';
export { useAutoSave, AUTO_SAVE_SLOT } from './useAutoSave';
export {
  useKeyboardShortcuts,
  createGameShortcuts,
  createCombatShortcuts,
} from './useKeyboardShortcuts';
export type { KeyboardShortcut } from './useKeyboardShortcuts';
export {
  useTouchGestures,
  createGameTouchHandlers,
} from './useTouchGestures';
export type { SwipeDirection, TouchGestureHandlers } from './useTouchGestures';
