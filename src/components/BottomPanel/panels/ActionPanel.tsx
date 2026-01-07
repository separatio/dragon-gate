/**
 * ActionPanel Component
 * Battle action buttons (Attack, Defend, Skills, Items, Flee)
 */

import { ActionOption } from '../BottomPanelContext';

interface ActionPanelProps {
  actions: ActionOption[];
}

const VARIANT_CLASSES: Record<string, string> = {
  primary: 'btn-action-primary',
  secondary: 'btn-action-secondary',
  danger: 'btn-action-danger',
};

export default function ActionPanel({ actions }: ActionPanelProps) {
  return (
    <div className="action-panel">
      <div className="action-panel-buttons">
        {actions.map((action) => (
          <button
            key={action.id}
            className={`btn-action ${VARIANT_CLASSES[action.variant ?? 'secondary']}`}
            onClick={action.onSelect}
            disabled={action.disabled}
            aria-label={action.label}
          >
            {action.icon && <span className="btn-action-icon">{action.icon}</span>}
            <span className="btn-action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
