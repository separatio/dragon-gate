/**
 * useGameLoader Hook
 * Manages game definition loading state and provides load/unload methods
 */

import { useState, useCallback } from 'react';
import type { GameDefinition } from '../types/game';
import { loadGame, LoadResult } from '../services/gameLoader';

interface UseGameLoaderState {
  game: GameDefinition | null;
  loading: boolean;
  error: string | null;
}

interface UseGameLoaderReturn extends UseGameLoaderState {
  load: (gamePath: string) => Promise<void>;
  unload: () => void;
}

export function useGameLoader(): UseGameLoaderReturn {
  const [state, setState] = useState<UseGameLoaderState>({
    game: null,
    loading: false,
    error: null,
  });

  const load = useCallback(async (gamePath: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const result: LoadResult = await loadGame(gamePath);

    if (result.success && result.game) {
      setState({
        game: result.game,
        loading: false,
        error: null,
      });
    } else {
      setState({
        game: null,
        loading: false,
        error: result.errors?.join(', ') || 'Failed to load game',
      });
    }
  }, []);

  const unload = useCallback(() => {
    setState({
      game: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    load,
    unload,
  };
}
