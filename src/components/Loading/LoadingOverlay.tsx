/**
 * Loading Overlay Component
 * Full-screen loading overlay for transitions
 */

import LoadingSpinner from './LoadingSpinner';

interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Loading message to display */
  message?: string;
  /** Whether to show a semi-transparent backdrop */
  backdrop?: boolean;
}

export default function LoadingOverlay({
  visible,
  message = 'Loading...',
  backdrop = true,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className={`loading-overlay ${backdrop ? 'loading-overlay--backdrop' : ''}`}
      role="alert"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="loading-overlay__content">
        <LoadingSpinner size="lg" />
        {message && <p className="loading-overlay__message">{message}</p>}
      </div>
    </div>
  );
}
