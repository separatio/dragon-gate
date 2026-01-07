/**
 * Accessibility Provider Component
 * Provides accessibility context and persists settings
 */

import { ReactNode, useState, useEffect, useCallback } from 'react';
import {
  AccessibilityContext,
  AccessibilityContextValue,
  AccessibilitySettings,
  DEFAULT_ACCESSIBILITY,
} from './AccessibilityContext';
import { applyAccessibilityOverrides } from './applyAccessibility';

/** LocalStorage key for persisting settings */
const STORAGE_KEY = 'dragon-gate-accessibility';

/**
 * Load accessibility settings from localStorage
 */
function loadFromStorage(): AccessibilitySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_ACCESSIBILITY, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore storage errors (e.g., private browsing)
  }
  return DEFAULT_ACCESSIBILITY;
}

/**
 * Save accessibility settings to localStorage
 */
function saveToStorage(settings: AccessibilitySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

interface AccessibilityProviderProps {
  /** Child components */
  children: ReactNode;
}

/**
 * AccessibilityProvider component
 * Wraps the app and provides accessibility settings context
 */
export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(loadFromStorage);

  const updateSetting = useCallback(
    <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
      setSettings((prev) => {
        const newSettings = { ...prev, [key]: value };
        saveToStorage(newSettings);
        return newSettings;
      });
    },
    []
  );

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_ACCESSIBILITY);
    saveToStorage(DEFAULT_ACCESSIBILITY);
  }, []);

  // Apply accessibility overrides when settings change
  useEffect(() => {
    applyAccessibilityOverrides(settings);
  }, [settings]);

  // Respect system preferences on initial load (only if not already set)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return; // User has explicit preferences, don't override

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersHighContrast = window.matchMedia('(prefers-contrast: more)');

    if (prefersReducedMotion.matches) {
      updateSetting('reduceMotion', true);
    }
    if (prefersHighContrast.matches) {
      updateSetting('highContrast', true);
    }
  }, [updateSetting]);

  const value: AccessibilityContextValue = {
    settings,
    updateSetting,
    resetToDefaults,
  };

  return (
    <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>
  );
}
