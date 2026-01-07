/**
 * Accessibility Application Utility
 * Applies accessibility overrides as CSS custom properties
 */

import type { AccessibilitySettings, FontScale } from './AccessibilityContext';

/** Font scale multipliers */
const FONT_SCALE_VALUES: Record<FontScale, number> = {
  small: 0.85,
  medium: 1,
  large: 1.15,
  xlarge: 1.3,
};

/** High contrast color overrides */
const HIGH_CONTRAST_COLORS = {
  background: '#000000',
  surface: '#111111',
  text: '#ffffff',
  textMuted: '#cccccc',
  textboxBg: 'rgba(0, 0, 0, 0.98)',
  textboxBorder: '#ffffff',
};

/** Dyslexia-friendly font stack */
const DYSLEXIA_FONT = "'OpenDyslexic', 'Comic Sans MS', sans-serif";

/**
 * Apply accessibility settings as CSS variable overrides
 * @param settings - Current accessibility settings
 */
export function applyAccessibilityOverrides(settings: AccessibilitySettings): void {
  const root = document.documentElement;

  // Font scaling
  root.style.setProperty('--a11y-font-scale', String(FONT_SCALE_VALUES[settings.fontScale]));

  // High contrast mode
  if (settings.highContrast) {
    root.style.setProperty('--a11y-high-contrast', '1');
    root.style.setProperty('--color-background', HIGH_CONTRAST_COLORS.background);
    root.style.setProperty('--color-surface', HIGH_CONTRAST_COLORS.surface);
    root.style.setProperty('--color-surface-elevated', '#222222');
    root.style.setProperty('--color-text', HIGH_CONTRAST_COLORS.text);
    root.style.setProperty('--color-text-muted', HIGH_CONTRAST_COLORS.textMuted);
    root.style.setProperty('--textbox-bg', HIGH_CONTRAST_COLORS.textboxBg);
    root.style.setProperty('--textbox-border', HIGH_CONTRAST_COLORS.textboxBorder);
  } else {
    root.style.setProperty('--a11y-high-contrast', '0');
  }

  // Reduce motion
  if (settings.reduceMotion) {
    root.style.setProperty('--a11y-reduce-motion', '1');
    root.style.setProperty('--transition-fast', '0ms');
    root.style.setProperty('--transition-normal', '0ms');
    root.style.setProperty('--transition-slow', '0ms');
    root.style.setProperty('--text-fade-duration', '0ms');
    root.style.setProperty('--text-word-delay', '0ms');
  } else {
    root.style.setProperty('--a11y-reduce-motion', '0');
    root.style.setProperty('--transition-fast', '150ms ease');
    root.style.setProperty('--transition-normal', '250ms ease');
    root.style.setProperty('--transition-slow', '400ms ease');
    root.style.setProperty('--text-fade-duration', '80ms');
    root.style.setProperty('--text-word-delay', '60ms');
  }

  // Dyslexia-friendly font
  if (settings.dyslexiaFont) {
    root.style.setProperty('--font-family', DYSLEXIA_FONT);
  }
}
