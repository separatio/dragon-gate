/**
 * Accessibility Context
 * Manages player accessibility preferences
 */

import { createContext } from 'react';

/** Font scale options */
export type FontScale = 'small' | 'medium' | 'large' | 'xlarge';

/** Accessibility settings that can be customized by the player */
export interface AccessibilitySettings {
  /** Text size scaling */
  fontScale: FontScale;
  /** High contrast mode for better visibility */
  highContrast: boolean;
  /** Disable animations for motion sensitivity */
  reduceMotion: boolean;
  /** Use dyslexia-friendly font */
  dyslexiaFont: boolean;
}

/** Accessibility context value */
export interface AccessibilityContextValue {
  /** Current settings */
  settings: AccessibilitySettings;
  /** Update a single setting */
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  /** Reset all settings to defaults */
  resetToDefaults: () => void;
}

/** Default accessibility settings */
export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  fontScale: 'medium',
  highContrast: false,
  reduceMotion: false,
  dyslexiaFont: false,
};

/** Accessibility context - null when outside provider */
export const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);
