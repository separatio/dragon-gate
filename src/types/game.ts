/**
 * Game definition types for Dragon Gate
 * The root type that ties everything together
 */

import type { ThemeConfig } from './theme';
import type { StatsConfig } from './stats';
import type { Scene } from './scene';
import type { Character, Enemy } from './character';
import type { Skill } from './skills';
import type { Item } from './items';

/** Complete game definition loaded from JSON */
export interface GameDefinition {
  /** Unique game identifier */
  id: string;
  /** Game title */
  title: string;
  /** Version string */
  version: string;
  /** Author name */
  author?: string;
  /** Game description */
  description?: string;

  /** Theme configuration */
  theme: ThemeConfig;

  /** Stat system configuration */
  stats: StatsConfig;

  /** Player character definitions */
  characters: {
    player: Character;
    [key: string]: Character;
  };

  /** Enemy definitions */
  enemies: Enemy[];

  /** Skill definitions */
  skills: Skill[];

  /** Item definitions */
  items: Item[];

  /** ID of the first scene */
  startingScene: string;

  /** All scenes in the game */
  scenes: Scene[];
}

/** Game settings stored locally */
export interface GameSettings {
  /** Maximum save slots */
  maxSaveSlots: number;
  /** Auto-save enabled */
  autoSaveEnabled: boolean;
  /** Auto-save interval in minutes */
  autoSaveInterval: number;
  /** Text display speed (words per second) */
  textSpeed: number;
}

/** Default game settings */
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  maxSaveSlots: 10,
  autoSaveEnabled: true,
  autoSaveInterval: 5,
  textSpeed: 10,
};
