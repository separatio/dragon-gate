/**
 * Theme Context
 * Provides theme configuration to the component tree
 */

import { createContext } from 'react';
import type { ThemeConfig } from '../types/theme';

/** Theme context value shape */
export interface ThemeContextValue {
  /** Current theme configuration */
  theme: ThemeConfig;
  /** Update the theme */
  setTheme: (theme: ThemeConfig) => void;
}

/** Theme context - null when outside provider */
export const ThemeContext = createContext<ThemeContextValue | null>(null);
