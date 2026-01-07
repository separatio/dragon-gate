/**
 * useAutoSave Hook
 * Handles automatic game saving at key points
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SaveManager } from '../services/SaveManager';
import type { Character } from '../types/character';
import type { AutoSaveConfig } from '../types/save';
import { DEFAULT_AUTO_SAVE_CONFIG, SAVE_STORAGE_KEYS } from '../types/save';

/** Auto-save slot is always slot 0 */
export const AUTO_SAVE_SLOT = 0;

interface UseAutoSaveOptions {
  /** Game ID */
  gameId: string | null;
  /** Player character */
  player: Character | null;
  /** Whether auto-save is currently allowed (e.g., not in battle) */
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  /** Whether auto-save is currently in progress */
  isSaving: boolean;
  /** Timestamp of last auto-save */
  lastSaveTime: Date | null;
  /** Trigger auto-save manually */
  triggerAutoSave: (sceneId: string, sceneName?: string) => void;
  /** Auto-save configuration */
  config: AutoSaveConfig;
  /** Update auto-save configuration */
  updateConfig: (config: Partial<AutoSaveConfig>) => void;
}

/**
 * Load auto-save config from localStorage
 */
function loadConfig(): AutoSaveConfig {
  try {
    const json = localStorage.getItem(SAVE_STORAGE_KEYS.AUTO_SAVE_CONFIG);
    if (json) {
      return { ...DEFAULT_AUTO_SAVE_CONFIG, ...JSON.parse(json) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_AUTO_SAVE_CONFIG;
}

/**
 * Save auto-save config to localStorage
 */
function saveConfig(config: AutoSaveConfig): void {
  localStorage.setItem(SAVE_STORAGE_KEYS.AUTO_SAVE_CONFIG, JSON.stringify(config));
}

/**
 * Auto-save hook for automatic game saving
 */
export function useAutoSave({
  gameId,
  player,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [config, setConfig] = useState<AutoSaveConfig>(loadConfig);

  // Refs to avoid stale closures
  const gameIdRef = useRef(gameId);
  const playerRef = useRef(player);
  const configRef = useRef(config);

  useEffect(() => {
    gameIdRef.current = gameId;
    playerRef.current = player;
    configRef.current = config;
  }, [gameId, player, config]);

  // Trigger auto-save
  const triggerAutoSave = useCallback((sceneId: string, sceneName?: string) => {
    const currentGameId = gameIdRef.current;
    const currentPlayer = playerRef.current;
    const currentConfig = configRef.current;

    if (!currentConfig.enabled || !currentGameId || !currentPlayer || !enabled) {
      return;
    }

    setIsSaving(true);

    // Use requestIdleCallback for non-blocking save
    const save = () => {
      const result = SaveManager.save(
        AUTO_SAVE_SLOT,
        currentGameId,
        currentPlayer,
        sceneId,
        sceneName ? `[Auto] ${sceneName}` : '[Auto Save]'
      );

      if (result.success) {
        setLastSaveTime(new Date());
      } else {
        console.warn('Auto-save failed:', result.error);
      }

      // Brief delay before hiding indicator
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(save, { timeout: 1000 });
    } else {
      setTimeout(save, 0);
    }
  }, [enabled]);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<AutoSaveConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...updates };
      saveConfig(updated);
      return updated;
    });
  }, []);

  return {
    isSaving,
    lastSaveTime,
    triggerAutoSave,
    config,
    updateConfig,
  };
}
