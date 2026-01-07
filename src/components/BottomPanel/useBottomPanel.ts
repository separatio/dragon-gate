/**
 * useBottomPanel Hook
 * Provides access to bottom panel context for controlling panel content
 */

import { useContext } from 'react';
import { BottomPanelContext, BottomPanelContextValue } from './BottomPanelContext';

/**
 * Hook to access and control the bottom panel
 * @returns Bottom panel context value
 * @throws Error if used outside BottomPanelProvider
 */
export function useBottomPanel(): BottomPanelContextValue {
  const context = useContext(BottomPanelContext);
  if (!context) {
    throw new Error('useBottomPanel must be used within a BottomPanelProvider');
  }
  return context;
}
