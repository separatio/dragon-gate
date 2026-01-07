/**
 * useSceneEngine Hook
 * React hook for managing scene engine state and actions
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { GameDefinition, Scene } from '../types';
import { SceneEngine, SceneState } from '../engine/SceneEngine';

interface UseSceneEngineReturn {
  state: SceneState;
  start: () => void;
  advance: () => void;
  selectChoice: (choiceId: string) => void;
  handleBattleEnd: (victory: boolean) => void;
  currentScene: Scene | null;
}

export function useSceneEngine(game: GameDefinition | null): UseSceneEngineReturn {
  const [state, setState] = useState<SceneState>({ type: 'idle' });
  const engineRef = useRef<SceneEngine | null>(null);

  useEffect(() => {
    if (!game) {
      engineRef.current = null;
      setState({ type: 'idle' });
      return;
    }

    engineRef.current = new SceneEngine({
      game,
      onStateChange: setState,
      onBattleStart: () => {
        // Battle system will handle this in later plans
      },
      onBattleEnd: () => {
        // Transition handled by engine
      },
    });
  }, [game]);

  const start = useCallback(() => {
    engineRef.current?.start();
  }, []);

  const advance = useCallback(() => {
    engineRef.current?.advanceContent();
  }, []);

  const selectChoice = useCallback((choiceId: string) => {
    engineRef.current?.selectChoice(choiceId);
  }, []);

  const handleBattleEnd = useCallback((victory: boolean) => {
    engineRef.current?.handleBattleEnd(victory);
  }, []);

  return {
    state,
    start,
    advance,
    selectChoice,
    handleBattleEnd,
    currentScene: engineRef.current?.getCurrentScene() || null,
  };
}
