/**
 * Save Manager Service
 * Handles save/load operations using localStorage
 */

import type {
  SaveData,
  SaveMetadata,
  SaveSlotInfo,
  SaveResult,
  LoadResult,
  SavedPlayerData,
  SavedStoryData,
} from '../types/save';
import {
  SAVE_VERSION,
  SAVE_STORAGE_KEYS,
  MAX_SAVE_SLOTS,
  createEmptySaveSlotInfo,
} from '../types/save';
import type { Character } from '../types/character';
import { StoryVariables } from '../stores/storyVariables';

/**
 * Save Manager
 * Provides save/load functionality for game state
 */
export const SaveManager = {
  /**
   * Save game to a specific slot
   */
  save(
    slot: number,
    gameId: string,
    player: Character,
    currentSceneId: string,
    sceneName?: string
  ): SaveResult {
    if (slot < 0 || slot >= MAX_SAVE_SLOTS) {
      return { success: false, error: `Invalid slot number: ${slot}` };
    }

    try {
      // Get existing save to preserve play time
      const existing = this.load(slot);
      const previousPlayTime = existing.data?.metadata.playTimeSeconds ?? 0;

      // Build player data
      const playerData: SavedPlayerData = {
        id: player.id,
        name: player.name,
        level: player.level ?? 1,
        exp: player.exp ?? 0,
        currentHp: player.currentHp ?? 100,
        currentMp: player.currentMp ?? 50,
        baseStats: player.baseStats,
        skills: player.skills,
        inventory: player.inventory ?? [],
        equipment: player.equipment ?? {},
      };

      // Build story data
      const storyData: SavedStoryData = {
        currentSceneId,
        variables: StoryVariables.getAll(),
      };

      // Build metadata
      const metadata: SaveMetadata = {
        slot,
        timestamp: new Date().toISOString(),
        playTimeSeconds: previousPlayTime, // Will be updated by play time tracker
        sceneName,
        playerLevel: playerData.level,
        playerName: playerData.name,
      };

      // Build complete save data
      const saveData: SaveData = {
        version: SAVE_VERSION,
        gameId,
        metadata,
        player: playerData,
        story: storyData,
      };

      // Validate before saving
      const validationError = this.validate(saveData);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Save to localStorage
      const key = this.getSlotKey(slot);
      localStorage.setItem(key, JSON.stringify(saveData));

      // Update last played timestamp
      localStorage.setItem(SAVE_STORAGE_KEYS.LAST_PLAYED, new Date().toISOString());

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: `Failed to save: ${message}` };
    }
  },

  /**
   * Load game from a specific slot
   */
  load(slot: number): LoadResult {
    if (slot < 0 || slot >= MAX_SAVE_SLOTS) {
      return { success: false, error: `Invalid slot number: ${slot}` };
    }

    try {
      const key = this.getSlotKey(slot);
      const json = localStorage.getItem(key);

      if (!json) {
        return { success: false, error: 'Save slot is empty' };
      }

      const data = JSON.parse(json) as SaveData;

      // Validate loaded data
      const validationError = this.validate(data);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Handle version migration if needed
      const migratedData = this.migrate(data);

      return { success: true, data: migratedData };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: `Failed to load: ${message}` };
    }
  },

  /**
   * Delete a save slot
   */
  delete(slot: number): SaveResult {
    if (slot < 0 || slot >= MAX_SAVE_SLOTS) {
      return { success: false, error: `Invalid slot number: ${slot}` };
    }

    try {
      const key = this.getSlotKey(slot);
      localStorage.removeItem(key);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: `Failed to delete: ${message}` };
    }
  },

  /**
   * Get info for all save slots
   */
  getAllSlotInfo(): SaveSlotInfo[] {
    const slots: SaveSlotInfo[] = [];

    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      slots.push(this.getSlotInfo(i));
    }

    return slots;
  },

  /**
   * Get info for a specific save slot
   */
  getSlotInfo(slot: number): SaveSlotInfo {
    if (slot < 0 || slot >= MAX_SAVE_SLOTS) {
      return createEmptySaveSlotInfo();
    }

    try {
      const key = this.getSlotKey(slot);
      const json = localStorage.getItem(key);

      if (!json) {
        return createEmptySaveSlotInfo();
      }

      const data = JSON.parse(json) as SaveData;
      return {
        isEmpty: false,
        metadata: data.metadata,
      };
    } catch {
      return createEmptySaveSlotInfo();
    }
  },

  /**
   * Check if a slot has save data
   */
  hasData(slot: number): boolean {
    if (slot < 0 || slot >= MAX_SAVE_SLOTS) {
      return false;
    }

    const key = this.getSlotKey(slot);
    return localStorage.getItem(key) !== null;
  },

  /**
   * Update play time for a slot (call periodically)
   */
  updatePlayTime(slot: number, additionalSeconds: number): void {
    const result = this.load(slot);
    if (!result.success || !result.data) return;

    const data = result.data;
    data.metadata.playTimeSeconds += additionalSeconds;

    const key = this.getSlotKey(slot);
    localStorage.setItem(key, JSON.stringify(data));
  },

  /**
   * Apply loaded save data to game state
   */
  applyToGame(data: SaveData): {
    player: Character;
    sceneId: string;
  } {
    // Restore story variables
    StoryVariables.loadFromSave(data.story.variables);

    // Build character from saved data
    const player: Character = {
      id: data.player.id,
      name: data.player.name,
      level: data.player.level,
      exp: data.player.exp,
      currentHp: data.player.currentHp,
      currentMp: data.player.currentMp,
      baseStats: data.player.baseStats,
      skills: data.player.skills,
      inventory: data.player.inventory,
      equipment: data.player.equipment,
    };

    return {
      player,
      sceneId: data.story.currentSceneId,
    };
  },

  /**
   * Get most recent save slot (by timestamp)
   */
  getMostRecentSlot(): number | null {
    let mostRecent: { slot: number; timestamp: Date } | null = null;

    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      const info = this.getSlotInfo(i);
      if (!info.isEmpty && info.metadata) {
        const timestamp = new Date(info.metadata.timestamp);
        if (!mostRecent || timestamp > mostRecent.timestamp) {
          mostRecent = { slot: i, timestamp };
        }
      }
    }

    return mostRecent?.slot ?? null;
  },

  /**
   * Clear all save data (use with caution!)
   */
  clearAll(): void {
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      const key = this.getSlotKey(i);
      localStorage.removeItem(key);
    }
    localStorage.removeItem(SAVE_STORAGE_KEYS.AUTO_SAVE_CONFIG);
    localStorage.removeItem(SAVE_STORAGE_KEYS.LAST_PLAYED);
  },

  /**
   * Export save data as JSON string (for backup)
   */
  exportSave(slot: number): string | null {
    const result = this.load(slot);
    if (!result.success || !result.data) return null;
    return JSON.stringify(result.data, null, 2);
  },

  /**
   * Import save data from JSON string
   */
  importSave(slot: number, json: string): SaveResult {
    try {
      const data = JSON.parse(json) as SaveData;

      const validationError = this.validate(data);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Update slot in metadata
      data.metadata.slot = slot;

      const key = this.getSlotKey(slot);
      localStorage.setItem(key, JSON.stringify(data));

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid JSON';
      return { success: false, error: `Import failed: ${message}` };
    }
  },

  // ============================================
  // Private helpers
  // ============================================

  /**
   * Get localStorage key for a slot
   */
  getSlotKey(slot: number): string {
    return `${SAVE_STORAGE_KEYS.SAVE_PREFIX}${slot}`;
  },

  /**
   * Validate save data structure
   */
  validate(data: SaveData): string | null {
    if (!data) {
      return 'Save data is null';
    }

    if (!data.version) {
      return 'Missing save version';
    }

    if (!data.gameId) {
      return 'Missing game ID';
    }

    if (!data.metadata) {
      return 'Missing metadata';
    }

    if (!data.player) {
      return 'Missing player data';
    }

    if (!data.story) {
      return 'Missing story data';
    }

    if (!data.player.id || !data.player.name) {
      return 'Invalid player data';
    }

    if (!data.story.currentSceneId) {
      return 'Missing current scene ID';
    }

    return null;
  },

  /**
   * Migrate save data from older versions
   */
  migrate(data: SaveData): SaveData {
    // Currently only version 1.0.0 exists
    // Add migration logic here when save format changes

    // Example future migration:
    // if (data.version === '1.0.0') {
    //   data = migrateV1ToV2(data);
    // }

    return data;
  },
};

/**
 * Hook for accessing SaveManager in components
 */
export function useSaveManager() {
  return SaveManager;
}
