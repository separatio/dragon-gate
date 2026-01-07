/**
 * Game Loader Service
 * Loads and validates game definition JSON files
 */

import type { GameDefinition } from '../types/game';
import { validateGameDefinition } from './gameValidator';

export interface LoadResult {
  success: boolean;
  game?: GameDefinition;
  errors?: string[];
}

/**
 * Load a game definition from a JSON file
 */
export async function loadGame(path: string): Promise<LoadResult> {
  try {
    const response = await fetch(path);

    if (!response.ok) {
      return {
        success: false,
        errors: [`Failed to load game: ${response.status} ${response.statusText}`],
      };
    }

    const json: unknown = await response.json();
    const validation = validateGameDefinition(json);

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    return {
      success: true,
      game: json as GameDefinition,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error loading game'],
    };
  }
}

/**
 * Get list of available games
 * In MVP, returns hardcoded list. Later: scan directory or fetch from index
 */
export async function loadGameList(): Promise<string[]> {
  return ['default'];
}
