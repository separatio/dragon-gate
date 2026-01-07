/**
 * useTextAnimation Hook
 * Manages word-by-word text reveal animation timing
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTextAnimationOptions {
  /** Text to animate */
  text: string;
  /** Words to reveal per second (default: 20) */
  wordsPerSecond?: number;
  /** Callback when all words are visible */
  onComplete?: () => void;
}

interface UseTextAnimationResult {
  /** Currently visible words */
  visibleWords: string[];
  /** Whether all words are visible */
  isComplete: boolean;
  /** Skip to show all words immediately */
  skip: () => void;
  /** Progress from 0 to 1 */
  progress: number;
}

/**
 * Hook for animating text word by word
 */
export function useTextAnimation({
  text,
  wordsPerSecond = 20,
  onComplete,
}: UseTextAnimationOptions): UseTextAnimationResult {
  const words = text.split(/\s+/).filter(Boolean);
  const [visibleCount, setVisibleCount] = useState(0);
  const isComplete = visibleCount >= words.length;
  const onCompleteRef = useRef(onComplete);
  const hasCalledComplete = useRef(false);

  // Keep onComplete ref updated
  onCompleteRef.current = onComplete;

  // Check for reduce motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reset when text changes
  useEffect(() => {
    setVisibleCount(prefersReducedMotion ? words.length : 0);
    hasCalledComplete.current = false;
  }, [text, prefersReducedMotion, words.length]);

  // Animate word reveal
  useEffect(() => {
    // If reduce motion, show all immediately
    if (prefersReducedMotion) {
      setVisibleCount(words.length);
      return;
    }

    if (visibleCount >= words.length) {
      return;
    }

    const intervalMs = 1000 / wordsPerSecond;
    const timer = setInterval(() => {
      setVisibleCount((prev) => {
        const next = prev + 1;
        if (next >= words.length) {
          clearInterval(timer);
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [words.length, wordsPerSecond, visibleCount, prefersReducedMotion]);

  // Call onComplete when animation finishes (only once per text)
  useEffect(() => {
    if (isComplete && !hasCalledComplete.current && words.length > 0) {
      hasCalledComplete.current = true;
      // Don't auto-call onComplete - wait for user interaction
    }
  }, [isComplete, words.length]);

  const skip = useCallback(() => {
    setVisibleCount(words.length);
  }, [words.length]);

  return {
    visibleWords: words.slice(0, visibleCount),
    isComplete,
    skip,
    progress: words.length > 0 ? visibleCount / words.length : 1,
  };
}
