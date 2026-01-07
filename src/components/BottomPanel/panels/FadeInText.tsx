/**
 * FadeInText Component
 * Renders words with fade-in animation
 */

import { memo } from 'react';

interface FadeInTextProps {
  /** Words to display */
  words: string[];
  /** Optional additional class name */
  className?: string;
}

/**
 * Memoized component for rendering fade-in words
 * Each word gets a CSS animation applied
 */
export const FadeInText = memo(function FadeInText({ words, className }: FadeInTextProps) {
  return (
    <span className={className}>
      {words.map((word, index) => (
        <span key={`${index}-${word}`} className="fade-in-word">
          {word}{' '}
        </span>
      ))}
    </span>
  );
});
