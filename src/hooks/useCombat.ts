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
import type { GameDefinition } from '../types/game';

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
  /** Dismiss current dialog (only for dialogs without choices) */
  dismissDialog: () => void;
  /** Select a choice in the current dialog */
  selectDialogChoice: (choiceId: string) => void;
  /** End the battle and clean up */
  endBattle: () => void;
  /** Whether currently in a battle */
  isInBattle: boolean;
}

/**
 * Hook for managing turn-based combat
 *
 * @param statEngine - The stat engine for calculating combat stats
 * @param game - The game definition for skill/item lookups
 * @returns Combat state and actions
 *
 * @example
 * ```tsx
 * const { snapshot, startBattle, selectAction, selectTargets, isInBattle } = useCombat(statEngine, game);
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
export function useCombat(statEngine: StatEngine, game: GameDefinition): UseCombatReturn {
  const machineRef = useRef<CombatStateMachine | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Use useSyncExternalStore for tear-free subscription
  const snapshot = useSyncExternalStore(
    // Subscribe function - re-subscribes when initialized changes
    useCallback(
      (callback) => {
        if (!machineRef.current) return () => {};
        return machineRef.current.subscribe(callback);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [initialized]
    ),
    // Get snapshot function
    useCallback(
      () => machineRef.current?.getSnapshot() ?? null,
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
      machineRef.current = new CombatStateMachine(statEngine, game, scene);
      machineRef.current.initialize(player, enemies);
      setInitialized(true);
      machineRef.current.start();
    },
    [statEngine, game]
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
   * Dismiss current battle dialog (only for dialogs without choices)
   */
  const dismissDialog = useCallback(() => {
    machineRef.current?.dismissDialog();
  }, []);

  /**
   * Select a choice in the current dialog
   */
  const selectDialogChoice = useCallback((choiceId: string) => {
    machineRef.current?.selectDialogChoice(choiceId);
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
    selectDialogChoice,
    endBattle,
    isInBattle: initialized && snapshot !== null
  };
}
