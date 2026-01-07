/**
 * TextDisplay Component
 * Story text display with word-by-word fade-in animation
 */

import { useCallback } from 'react';
import { useTextAnimation } from '../../../hooks/useTextAnimation';
import { FadeInText } from './FadeInText';
import { useAccessibility } from '../../../theme/useAccessibility';

interface TextDisplayProps {
  /** Text content to display */
  content: string;
  /** Optional speaker name */
  speaker?: string;
  /** Called when user advances past completed text */
  onComplete?: () => void;
}

/**
 * TextDisplay component
 * Shows narrative text with animated word reveal
 */
export default function TextDisplay({ content, speaker, onComplete }: TextDisplayProps) {
  const { settings } = useAccessibility();

  const { visibleWords, isComplete, skip } = useTextAnimation({
    text: content,
    wordsPerSecond: settings.reduceMotion ? Infinity : 20,
  });

  const handleClick = useCallback(() => {
    if (!isComplete) {
      skip();
    } else {
      onComplete?.();
    }
  }, [isComplete, skip, onComplete]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <div
      className="text-display"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={isComplete ? 'Tap to continue' : 'Tap to skip text animation'}
    >
      <div className="textbox h-full flex flex-col">
        {speaker && <div className="text-display-speaker">{speaker}</div>}
        <div className="text-display-content">
          <FadeInText words={visibleWords} />
        </div>
        <div className="text-display-indicator">
          {isComplete ? (
            <span className="tap-indicator">Tap to continue ▼</span>
          ) : (
            <span className="tap-indicator tap-indicator-dim">Tap to skip</span>
          )}
        </div>
      </div>
    </div>
  );
}
