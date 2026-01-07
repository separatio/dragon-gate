/**
 * Theme Module
 * Provides theming and accessibility functionality for Dragon Gate
 */

// Theme exports
export { ThemeProvider, DEFAULT_THEME } from './ThemeProvider';
export { useTheme } from './useTheme';
export { applyThemeToRoot } from './applyTheme';
export type { ThemeContextValue } from './ThemeContext';

// Accessibility exports
export { AccessibilityProvider } from './AccessibilityProvider';
export { useAccessibility } from './useAccessibility';
export { applyAccessibilityOverrides } from './applyAccessibility';
export { DEFAULT_ACCESSIBILITY } from './AccessibilityContext';
export type {
  AccessibilitySettings,
  AccessibilityContextValue,
  FontScale,
} from './AccessibilityContext';
