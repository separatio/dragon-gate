/**
 * Loading Spinner Component
 * Reusable animated spinner for loading states
 */

interface LoadingSpinnerProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional label text */
  label?: string;
  /** Whether to center in container */
  centered?: boolean;
}

const sizeClasses = {
  sm: 'loading-spinner--sm',
  md: 'loading-spinner--md',
  lg: 'loading-spinner--lg',
};

export default function LoadingSpinner({
  size = 'md',
  label,
  centered = false,
}: LoadingSpinnerProps) {
  const containerClass = centered
    ? 'loading-spinner-container loading-spinner-container--centered'
    : 'loading-spinner-container';

  return (
    <div className={containerClass}>
      <div className={`loading-spinner ${sizeClasses[size]}`} role="status">
        <span className="loading-spinner__ring" />
      </div>
      {label && <p className="loading-spinner__label">{label}</p>}
    </div>
  );
}
