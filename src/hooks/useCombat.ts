/**
 * useCombat Hook
 * React hook for managing combat state machine
 */

import { useState, useCallback, useRef, useSyncExternalStore } from 'react';
import {
  CombatStateMachine,
  CombatSnapshot,
  CombatAction
} from '../engine/combat/CombatState';
import { StatEngine } from '../engine/stats/StatEngine';
import type { Character, Enemy } from '../types/character';
import type { Scene } from '../types/scene';

/**
 * Return type for useCombat hook
 */
export interface UseCombatReturn {
  /** Current combat snapshot (null if not in battle) */
  snapshot: CombatSnapshot | null;
  /** Start a new battle */
  startBattle: (scene: Scene, player: Character, enemies: Enemy[]) => void;
  /** Select an action (during action_select phase) */
  selectAction: (action: CombatAction) => void;
  /** Select targets for pending action (during target_select phase) */
  selectTargets: (targetIds: string[]) => void;
  /** Cancel target selection and return to action select */
  cancelTargetSelection: () => void;
  /** Dismiss current dialog */
  dismissDialog: () => void;
  /** End the battle and clean up */
  endBattle: () => void;
  /** Whether currently in a battle */
  isInBattle: boolean;
}

/**
 * Hook for managing turn-based combat
 *
 * @param statEngine - The stat engine for calculating combat stats
 * @returns Combat state and actions
 *
 * @example
 * ```tsx
 * const { snapshot, startBattle, selectAction, selectTargets, isInBattle } = useCombat(statEngine);
 *
 * // Start a battle
 * startBattle(battleScene, player, [goblin, wolf]);
 *
 * // During action_select phase
 * if (snapshot?.phase === 'action_select') {
 *   selectAction({ type: 'skill', actorId: player.id, skillId: 'fireball' });
 * }
 *
 * // During target_select phase
 * if (snapshot?.phase === 'target_select') {
 *   selectTargets([goblin.id]);
 * }
 * ```
 */
export function useCombat(statEngine: StatEngine): UseCombatReturn {
  const machineRef = useRef<CombatStateMachine | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Use useSyncExternalStore for tear-free subscription
  const snapshot = useSyncExternalStore(
    // Subscribe function
    useCallback(
      (callback) => {
        if (!machineRef.current) return () => {};
        return machineRef.current.subscribe(callback);
      },
      [initialized]
    ),
    // Get snapshot function
    useCallback(
      () => machineRef.current?.getSnapshot() ?? null,
      [initialized]
    ),
    // Get server snapshot (SSR)
    useCallback(() => null, [])
  );

  /**
   * Start a new battle
   */
  const startBattle = useCallback(
    (scene: Scene, player: Character, enemies: Enemy[]) => {
      machineRef.current = new CombatStateMachine(statEngine, scene);
      machineRef.current.initialize(player, enemies);
      setInitialized(true);
      machineRef.current.start();
    },
    [statEngine]
  );

  /**
   * Select an action during action_select phase
   */
  const selectAction = useCallback((action: CombatAction) => {
    machineRef.current?.selectAction(action);
  }, []);

  /**
   * Select targets during target_select phase
   */
  const selectTargets = useCallback((targetIds: string[]) => {
    machineRef.current?.selectTargets(targetIds);
  }, []);

  /**
   * Cancel target selection
   */
  const cancelTargetSelection = useCallback(() => {
    machineRef.current?.cancelTargetSelection();
  }, []);

  /**
   * Dismiss current battle dialog
   */
  const dismissDialog = useCallback(() => {
    machineRef.current?.dismissDialog();
  }, []);

  /**
   * End the battle and clean up
   */
  const endBattle = useCallback(() => {
    machineRef.current = null;
    setInitialized(false);
  }, []);

  return {
    snapshot,
    startBattle,
    selectAction,
    selectTargets,
    cancelTargetSelection,
    dismissDialog,
    endBattle,
    isInBattle: initialized && snapshot !== null
  };
}
