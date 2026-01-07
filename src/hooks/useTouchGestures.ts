/**
 * useTouchGestures Hook
 * Handles touch gestures for mobile navigation
 */

import { useEffect, useRef, useCallback } from 'react';

/** Swipe direction */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

/** Touch gesture handlers */
export interface TouchGestureHandlers {
  /** Called on tap (quick touch without movement) */
  onTap?: () => void;
  /** Called on swipe in any direction */
  onSwipe?: (direction: SwipeDirection) => void;
  /** Called specifically on swipe left */
  onSwipeLeft?: () => void;
  /** Called specifically on swipe right */
  onSwipeRight?: () => void;
  /** Called specifically on swipe up */
  onSwipeUp?: () => void;
  /** Called specifically on swipe down */
  onSwipeDown?: () => void;
  /** Called on long press */
  onLongPress?: () => void;
}

interface UseTouchGesturesOptions {
  /** Element ref to attach listeners to (defaults to window) */
  elementRef?: React.RefObject<HTMLElement>;
  /** Whether gestures are enabled */
  enabled?: boolean;
  /** Minimum distance in pixels for swipe detection */
  swipeThreshold?: number;
  /** Maximum time in ms for swipe gesture */
  swipeTimeout?: number;
  /** Time in ms for long press detection */
  longPressTime?: number;
  /** Gesture handlers */
  handlers: TouchGestureHandlers;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  longPressTimer: ReturnType<typeof setTimeout> | null;
}

/**
 * Hook for handling touch gestures
 */
export function useTouchGestures({
  elementRef,
  enabled = true,
  swipeThreshold = 50,
  swipeTimeout = 300,
  longPressTime = 500,
  handlers,
}: UseTouchGesturesOptions): void {
  const touchState = useRef<TouchState | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const clearLongPressTimer = useCallback(() => {
    if (touchState.current?.longPressTimer) {
      clearTimeout(touchState.current.longPressTimer);
      touchState.current.longPressTimer = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;

      clearLongPressTimer();

      const longPressTimer = handlersRef.current.onLongPress
        ? setTimeout(() => {
            handlersRef.current.onLongPress?.();
            touchState.current = null; // Prevent other gestures after long press
          }, longPressTime)
        : null;

      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        longPressTimer,
      };
    },
    [longPressTime, clearLongPressTimer]
  );

  const handleTouchMove = useCallback(() => {
    // Clear long press timer on move (user is swiping, not pressing)
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      clearLongPressTimer();

      if (!touchState.current) return;

      const touch = event.changedTouches[0];
      if (!touch) return;

      const { startX, startY, startTime } = touchState.current;
      const endX = touch.clientX;
      const endY = touch.clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = Date.now() - startTime;

      touchState.current = null;

      // Check if it's a tap (minimal movement, quick touch)
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance < 10 && deltaTime < 200) {
        handlersRef.current.onTap?.();
        return;
      }

      // Check for swipe (sufficient distance within time limit)
      if (deltaTime > swipeTimeout) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Determine swipe direction
      if (absX > swipeThreshold || absY > swipeThreshold) {
        let direction: SwipeDirection;

        if (absX > absY) {
          // Horizontal swipe
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          // Vertical swipe
          direction = deltaY > 0 ? 'down' : 'up';
        }

        // Call general swipe handler
        handlersRef.current.onSwipe?.(direction);

        // Call direction-specific handlers
        switch (direction) {
          case 'left':
            handlersRef.current.onSwipeLeft?.();
            break;
          case 'right':
            handlersRef.current.onSwipeRight?.();
            break;
          case 'up':
            handlersRef.current.onSwipeUp?.();
            break;
          case 'down':
            handlersRef.current.onSwipeDown?.();
            break;
        }
      }
    },
    [swipeThreshold, swipeTimeout, clearLongPressTimer]
  );

  const handleTouchCancel = useCallback(() => {
    clearLongPressTimer();
    touchState.current = null;
  }, [clearLongPressTimer]);

  useEffect(() => {
    if (!enabled) return;

    const element = elementRef?.current ?? window;

    element.addEventListener('touchstart', handleTouchStart as EventListener, {
      passive: true,
    });
    element.addEventListener('touchmove', handleTouchMove as EventListener, {
      passive: true,
    });
    element.addEventListener('touchend', handleTouchEnd as EventListener, {
      passive: true,
    });
    element.addEventListener(
      'touchcancel',
      handleTouchCancel as EventListener,
      { passive: true }
    );

    return () => {
      element.removeEventListener(
        'touchstart',
        handleTouchStart as EventListener
      );
      element.removeEventListener('touchmove', handleTouchMove as EventListener);
      element.removeEventListener('touchend', handleTouchEnd as EventListener);
      element.removeEventListener(
        'touchcancel',
        handleTouchCancel as EventListener
      );
      clearLongPressTimer();
    };
  }, [
    enabled,
    elementRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    clearLongPressTimer,
  ]);
}

/**
 * Create game touch gesture handlers
 */
export function createGameTouchHandlers(handlers: {
  onAdvance?: () => void;
  onMenu?: () => void;
  onNextChoice?: () => void;
  onPrevChoice?: () => void;
}): TouchGestureHandlers {
  return {
    onTap: handlers.onAdvance,
    onSwipeLeft: handlers.onNextChoice,
    onSwipeRight: handlers.onPrevChoice,
    onSwipeDown: handlers.onMenu,
  };
}
