/**
 * Theme Provider Component
 * Provides theme context and applies CSS variables
 */

import { ReactNode, useState, useEffect, useCallback } from 'react';
import { ThemeContext, ThemeContextValue } from './ThemeContext';
import { applyThemeToRoot } from './applyTheme';
import type { ThemeConfig } from '../types/theme';

/** Default theme matching the CSS variables foundation */
const DEFAULT_THEME: ThemeConfig = {
  colors: {
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#e94560',
    accentHover: '#d63d56',
    background: '#0f0f23',
    text: '#eaeaea',
    textMuted: '#888888',
    success: '#4ade80',
    warning: '#fbbf24',
    danger: '#ef4444',
  },
  textbox: {
    background: 'rgba(26, 26, 46, 0.95)',
    text: '#eaeaea',
    border: '#e94560',
  },
  typography: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontFamilyUI: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    baseFontSize: '1rem',
    lineHeight: '1.6',
  },
};

interface ThemeProviderProps {
  /** Child components */
  children: ReactNode;
  /** Initial theme configuration (optional) */
  initialTheme?: ThemeConfig;
}

/**
 * ThemeProvider component
 * Wraps the app and provides theme context
 */
export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeConfig>(initialTheme ?? DEFAULT_THEME);

  const setTheme = useCallback((newTheme: ThemeConfig) => {
    setThemeState(newTheme);
  }, []);

  // Apply theme to CSS variables whenever it changes
  useEffect(() => {
    applyThemeToRoot(theme);
  }, [theme]);

  const value: ThemeContextValue = {
    theme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export { DEFAULT_THEME };
