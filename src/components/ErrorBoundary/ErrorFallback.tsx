/**
 * Error Fallback Component
 * Displays error information with recovery options
 */

import { useContext } from 'react';
import { ScreenContext, Screen } from '../../ScreenProvider';

interface ErrorFallbackProps {
  /** The error that was caught */
  error: Error | null;
  /** Additional error info from React */
  errorInfo: React.ErrorInfo | null;
  /** Called when user wants to retry */
  onReset?: () => void;
}

export default function ErrorFallback({
  error,
  errorInfo,
  onReset,
}: ErrorFallbackProps) {
  const screenContext = useContext(ScreenContext);

  const handleReturnToMenu = () => {
    // Reset error state first
    onReset?.();
    // Navigate to main menu
    screenContext?.setCurrentScreen(Screen.MainMenu);
  };

  const handleReload = () => {
    window.location.reload();
  };

  // In production, show minimal error info
  const isDev = import.meta.env.DEV;

  return (
    <div className="error-fallback">
      <div className="error-fallback__content">
        <div className="error-fallback__icon">!</div>
        <h1 className="error-fallback__title">Something went wrong</h1>
        <p className="error-fallback__message">
          An unexpected error occurred. Your progress has been saved automatically.
        </p>

        {isDev && error && (
          <details className="error-fallback__details">
            <summary>Error Details (Development Only)</summary>
            <div className="error-fallback__error">
              <strong>{error.name}:</strong> {error.message}
            </div>
            {errorInfo?.componentStack && (
              <pre className="error-fallback__stack">
                {errorInfo.componentStack}
              </pre>
            )}
          </details>
        )}

        <div className="error-fallback__actions">
          {onReset && (
            <button
              className="error-fallback__button"
              onClick={onReset}
            >
              Try Again
            </button>
          )}
          <button
            className="error-fallback__button error-fallback__button--primary"
            onClick={handleReturnToMenu}
          >
            Return to Menu
          </button>
          <button
            className="error-fallback__button error-fallback__button--secondary"
            onClick={handleReload}
          >
            Reload Game
          </button>
        </div>
      </div>
    </div>
  );
}
