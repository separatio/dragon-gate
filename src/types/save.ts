/**
 * Save System Types
 * Defines the structure of save game data
 */

import type { StatBlock } from './stats';
import type { InventoryItem } from './items';
import type { ActiveModifier } from './modifiers';

/**
 * Version string for save data format
 * Increment when save format changes to handle migrations
 */
export const SAVE_VERSION = '1.0.0';

/**
 * Saved player character state
 */
export interface SavedPlayerData {
  /** Player ID */
  id: string;
  /** Player name */
  name: string;
  /** Current level */
  level: number;
  /** Current experience points */
  exp: number;
  /** Current HP */
  currentHp: number;
  /** Current MP */
  currentMp: number;
  /** Base stats (without modifiers) */
  baseStats: StatBlock;
  /** Learned skill IDs */
  skills: string[];
  /** Inventory items */
  inventory: InventoryItem[];
  /** Equipment by slot */
  equipment: Record<string, string>;
  /** Active modifiers (buffs/debuffs that should persist) */
  persistentModifiers?: ActiveModifier[];
}

/**
 * Saved story progress
 */
export interface SavedStoryData {
  /** Current scene ID */
  currentSceneId: string;
  /** Story variables and flags */
  variables: Record<string, string | number | boolean | null>;
  /** Completed scene IDs (for tracking) */
  completedScenes?: string[];
  /** Defeated enemy IDs (for unique enemies) */
  defeatedEnemies?: string[];
}

/**
 * Save metadata for display in save slots
 */
export interface SaveMetadata {
  /** Save slot number (0-9) */
  slot: number;
  /** Timestamp when saved (ISO string) */
  timestamp: string;
  /** Total play time in seconds */
  playTimeSeconds: number;
  /** Scene name for display */
  sceneName?: string;
  /** Player level for display */
  playerLevel: number;
  /** Player name for display */
  playerName: string;
  /** Optional thumbnail/screenshot (base64) */
  thumbnail?: string;
}

/**
 * Complete save game data
 */
export interface SaveData {
  /** Save format version for migrations */
  version: string;
  /** Game ID this save is for */
  gameId: string;
  /** Save metadata */
  metadata: SaveMetadata;
  /** Player state */
  player: SavedPlayerData;
  /** Story progress */
  story: SavedStoryData;
}

/**
 * Save slot info for UI display (without full data)
 */
export interface SaveSlotInfo {
  /** Whether slot has data */
  isEmpty: boolean;
  /** Metadata if slot has data */
  metadata?: SaveMetadata;
}

/**
 * Result of a save operation
 */
export interface SaveResult {
  /** Whether save succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Result of a load operation
 */
export interface LoadResult {
  /** Whether load succeeded */
  success: boolean;
  /** Loaded data if successful */
  data?: SaveData;
  /** Error message if failed */
  error?: string;
}

/**
 * Auto-save configuration
 */
export interface AutoSaveConfig {
  /** Whether auto-save is enabled */
  enabled: boolean;
  /** Interval in minutes between auto-saves */
  intervalMinutes: number;
  /** Auto-save slot number (-1 for rotating) */
  slot: number;
  /** Whether to auto-save on scene change */
  onSceneChange: boolean;
  /** Whether to auto-save before battle */
  beforeBattle: boolean;
}

/**
 * Default auto-save configuration
 */
export const DEFAULT_AUTO_SAVE_CONFIG: AutoSaveConfig = {
  enabled: true,
  intervalMinutes: 5,
  slot: 0, // Dedicated auto-save slot
  onSceneChange: true,
  beforeBattle: true,
};

/**
 * Storage keys for save system
 */
export const SAVE_STORAGE_KEYS = {
  /** Prefix for save slots */
  SAVE_PREFIX: 'dragon_gate_save_',
  /** Key for auto-save config */
  AUTO_SAVE_CONFIG: 'dragon_gate_auto_save_config',
  /** Key for last played timestamp */
  LAST_PLAYED: 'dragon_gate_last_played',
} as const;

/**
 * Maximum number of save slots
 */
export const MAX_SAVE_SLOTS = 10;

/**
 * Create an empty save slot info
 */
export function createEmptySaveSlotInfo(): SaveSlotInfo {
  return { isEmpty: true };
}

/**
 * Format play time for display (HH:MM:SS)
 */
export function formatPlayTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString();
}
