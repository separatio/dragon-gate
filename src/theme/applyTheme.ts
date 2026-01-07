/**
 * Theme Application Utility
 * Applies theme configuration as CSS custom properties
 */

import type { ThemeConfig } from '../types/theme';

/**
 * Apply theme configuration as CSS variables on the root element
 * @param theme - Theme configuration to apply
 */
export function applyThemeToRoot(theme: ThemeConfig): void {
  const root = document.documentElement;

  // Colors
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-accent-hover', theme.colors.accentHover ?? adjustColor(theme.colors.accent, -10));
  root.style.setProperty('--color-background', theme.colors.background);
  root.style.setProperty('--color-text', theme.colors.text);
  root.style.setProperty('--color-text-muted', theme.colors.textMuted);
  root.style.setProperty('--color-success', theme.colors.success);
  root.style.setProperty('--color-warning', theme.colors.warning);
  root.style.setProperty('--color-danger', theme.colors.danger);

  // Surface color derived from secondary
  root.style.setProperty('--color-surface', theme.colors.secondary);
  root.style.setProperty('--color-surface-elevated', adjustColor(theme.colors.secondary, 15));

  // Textbox
  root.style.setProperty('--textbox-bg', theme.textbox.background);
  root.style.setProperty('--textbox-text', theme.textbox.text);
  root.style.setProperty('--textbox-border', theme.textbox.border);

  // Typography
  root.style.setProperty('--font-family', theme.typography.fontFamily);
  root.style.setProperty('--font-family-ui', theme.typography.fontFamilyUI);
  root.style.setProperty('--font-size-base', theme.typography.baseFontSize);
  root.style.setProperty('--line-height', theme.typography.lineHeight);

  // Generate RGB versions for alpha compositing
  const accentRGB = hexToRGB(theme.colors.accent);
  if (accentRGB) {
    root.style.setProperty('--color-accent-rgb', `${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}`);
  }

  const bgRGB = hexToRGB(theme.colors.background);
  if (bgRGB) {
    root.style.setProperty('--color-background-rgb', `${bgRGB.r}, ${bgRGB.g}, ${bgRGB.b}`);
  }
}

/**
 * Adjust a hex color's brightness
 * @param hex - Hex color string
 * @param percent - Percentage to adjust (-100 to 100)
 * @returns Adjusted color as rgb() string
 */
function adjustColor(hex: string, percent: number): string {
  const rgb = hexToRGB(hex);
  if (!rgb) return hex;

  const adjust = (value: number) =>
    Math.min(255, Math.max(0, Math.round(value + (value * percent) / 100)));

  return `rgb(${adjust(rgb.r)}, ${adjust(rgb.g)}, ${adjust(rgb.b)})`;
}

/**
 * Convert hex color to RGB object
 * @param hex - Hex color string (with or without #)
 * @returns RGB object or null if invalid
 */
function hexToRGB(hex: string): { r: number; g: number; b: number } | null {
  // Handle rgba/rgb strings
  if (hex.startsWith('rgb')) {
    const match = hex.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
      };
    }
    return null;
  }

  // Handle hex strings
  const pattern = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
  const match = hex.match(pattern);
  return match
    ? {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16),
      }
    : null;
}
