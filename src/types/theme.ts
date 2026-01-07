/**
 * Theme configuration types for Dragon Gate
 * Defines colors, typography, and textbox styling
 */

/** Color palette for the game theme */
export interface ThemeColors {
  /** Primary background color */
  primary: string;
  /** Secondary/surface color */
  secondary: string;
  /** Accent color for interactive elements */
  accent: string;
  /** Hover state for accent color */
  accentHover?: string;
  /** Main background color */
  background: string;
  /** Primary text color */
  text: string;
  /** Muted/secondary text color */
  textMuted: string;
  /** Success state color */
  success: string;
  /** Warning state color */
  warning: string;
  /** Danger/error state color */
  danger: string;
}

/** Textbox styling configuration */
export interface TextboxConfig {
  /** Background color (can include alpha) */
  background: string;
  /** Text color inside textbox */
  text: string;
  /** Border color */
  border: string;
}

/** Typography configuration */
export interface TypographyConfig {
  /** Main narrative font family */
  fontFamily: string;
  /** UI font family */
  fontFamilyUI: string;
  /** Base font size */
  baseFontSize: string;
  /** Line height multiplier */
  lineHeight: string;
}

/** Complete theme configuration */
export interface ThemeConfig {
  /** Color palette */
  colors: ThemeColors;
  /** Textbox styling */
  textbox: TextboxConfig;
  /** Typography settings */
  typography: TypographyConfig;
}
