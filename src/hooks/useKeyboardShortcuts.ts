/**
 * useKeyboardShortcuts Hook
 * Centralized keyboard shortcut handling for the game
 */

import { useEffect, useCallback, useRef } from 'react';

/** Shortcut definition */
export interface KeyboardShortcut {
  /** Key to listen for (e.g., 'Enter', 'Escape', '1') */
  key: string;
  /** Optional modifier keys */
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  /** Handler function */
  handler: (event: KeyboardEvent) => void;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
  /** Whether shortcut is currently enabled */
  enabled?: boolean;
  /** Description for help display */
  description?: string;
}

interface UseKeyboardShortcutsOptions {
  /** Whether shortcuts are enabled globally */
  enabled?: boolean;
  /** Shortcuts to register */
  shortcuts: KeyboardShortcut[];
}

/**
 * Check if modifiers match
 */
function modifiersMatch(
  event: KeyboardEvent,
  modifiers?: KeyboardShortcut['modifiers']
): boolean {
  if (!modifiers) {
    // If no modifiers specified, ensure none are pressed
    return !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
  }

  return (
    !!modifiers.ctrl === event.ctrlKey &&
    !!modifiers.shift === event.shiftKey &&
    !!modifiers.alt === event.altKey &&
    !!modifiers.meta === event.metaKey
  );
}

/**
 * Hook for handling keyboard shortcuts
 */
export function useKeyboardShortcuts({
  enabled = true,
  shortcuts,
}: UseKeyboardShortcutsOptions): void {
  // Use ref to avoid stale closure issues
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcutsRef.current) {
        // Skip disabled shortcuts
        if (shortcut.enabled === false) continue;

        // Check if key matches
        if (event.key !== shortcut.key) continue;

        // Check if modifiers match
        if (!modifiersMatch(event, shortcut.modifiers)) continue;

        // Execute handler
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.handler(event);
        return;
      }
    },
    []
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

/**
 * Common game shortcuts factory
 */
export function createGameShortcuts(handlers: {
  onAdvance?: () => void;
  onMenu?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  onChoice?: (index: number) => void;
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];

  // Advance text (Enter, Space)
  if (handlers.onAdvance) {
    shortcuts.push(
      {
        key: 'Enter',
        handler: handlers.onAdvance,
        description: 'Advance text',
      },
      {
        key: ' ',
        handler: handlers.onAdvance,
        description: 'Advance text',
      }
    );
  }

  // Menu (Escape)
  if (handlers.onMenu) {
    shortcuts.push({
      key: 'Escape',
      handler: handlers.onMenu,
      description: 'Open menu / Go back',
    });
  }

  // Quick save (Ctrl+S)
  if (handlers.onSave) {
    shortcuts.push({
      key: 's',
      modifiers: { ctrl: true },
      handler: handlers.onSave,
      description: 'Quick save',
    });
  }

  // Quick load (Ctrl+L)
  if (handlers.onLoad) {
    shortcuts.push({
      key: 'l',
      modifiers: { ctrl: true },
      handler: handlers.onLoad,
      description: 'Quick load',
    });
  }

  // Number keys for choices (1-9)
  if (handlers.onChoice) {
    for (let i = 1; i <= 9; i++) {
      shortcuts.push({
        key: String(i),
        handler: () => handlers.onChoice!(i - 1),
        description: `Select choice ${i}`,
      });
    }
  }

  return shortcuts;
}

/**
 * Combat shortcuts factory
 */
export function createCombatShortcuts(handlers: {
  onAttack?: () => void;
  onDefend?: () => void;
  onSkill?: () => void;
  onItem?: () => void;
  onFlee?: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  onTarget?: (index: number) => void;
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];

  // Attack (A)
  if (handlers.onAttack) {
    shortcuts.push({
      key: 'a',
      handler: handlers.onAttack,
      description: 'Attack',
    });
  }

  // Defend (D)
  if (handlers.onDefend) {
    shortcuts.push({
      key: 'd',
      handler: handlers.onDefend,
      description: 'Defend',
    });
  }

  // Skills (S)
  if (handlers.onSkill) {
    shortcuts.push({
      key: 's',
      handler: handlers.onSkill,
      description: 'Skills',
    });
  }

  // Items (I)
  if (handlers.onItem) {
    shortcuts.push({
      key: 'i',
      handler: handlers.onItem,
      description: 'Items',
    });
  }

  // Flee (F)
  if (handlers.onFlee) {
    shortcuts.push({
      key: 'f',
      handler: handlers.onFlee,
      description: 'Flee',
    });
  }

  // Cancel (Escape)
  if (handlers.onCancel) {
    shortcuts.push({
      key: 'Escape',
      handler: handlers.onCancel,
      description: 'Cancel',
    });
  }

  // Confirm (Enter)
  if (handlers.onConfirm) {
    shortcuts.push({
      key: 'Enter',
      handler: handlers.onConfirm,
      description: 'Confirm',
    });
  }

  // Target selection (1-9)
  if (handlers.onTarget) {
    for (let i = 1; i <= 9; i++) {
      shortcuts.push({
        key: String(i),
        handler: () => handlers.onTarget!(i - 1),
        description: `Select target ${i}`,
      });
    }
  }

  return shortcuts;
}
