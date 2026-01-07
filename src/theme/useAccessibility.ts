/**
 * useAccessibility Hook
 * Provides access to accessibility settings context
 */

import { useContext } from 'react';
import { AccessibilityContext, AccessibilityContextValue } from './AccessibilityContext';

/**
 * Hook to access accessibility settings
 * @returns Accessibility context value with settings and updaters
 * @throws Error if used outside AccessibilityProvider
 */
export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
