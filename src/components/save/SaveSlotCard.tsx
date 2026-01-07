/**
 * Save Slot Card Component
 * Displays a single save slot with metadata and actions
 */

import type { SaveSlotInfo } from '../../types/save';
import { formatPlayTime, formatTimestamp } from '../../types/save';

interface SaveSlotCardProps {
  /** Slot number */
  slot: number;
  /** Slot info with metadata */
  info: SaveSlotInfo;
  /** Mode determines which action is primary */
  mode: 'save' | 'load';
  /** Called when slot is selected */
  onSelect: (slot: number) => void;
  /** Called when delete is requested */
  onDelete?: (slot: number) => void;
  /** Whether this slot is currently selected */
  isSelected?: boolean;
}

export default function SaveSlotCard({
  slot,
  info,
  mode,
  onSelect,
  onDelete,
  isSelected,
}: SaveSlotCardProps) {
  const handleClick = () => {
    onSelect(slot);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && !info.isEmpty) {
      onDelete(slot);
    }
  };

  // Empty slot
  if (info.isEmpty) {
    return (
      <button
        className={`save-slot save-slot--empty ${isSelected ? 'save-slot--selected' : ''}`}
        onClick={handleClick}
        disabled={mode === 'load'}
        aria-label={`Empty slot ${slot + 1}`}
      >
        <div className="save-slot__number">Slot {slot + 1}</div>
        <div className="save-slot__empty-label">
          {mode === 'save' ? 'New Save' : 'Empty'}
        </div>
      </button>
    );
  }

  // Slot with data
  const { metadata } = info;
  if (!metadata) return null;

  return (
    <button
      className={`save-slot save-slot--filled ${isSelected ? 'save-slot--selected' : ''}`}
      onClick={handleClick}
      aria-label={`Slot ${slot + 1}: ${metadata.playerName} - ${metadata.sceneName ?? 'Unknown'}`}
    >
      <div className="save-slot__header">
        <span className="save-slot__number">Slot {slot + 1}</span>
        {onDelete && (
          <button
            className="save-slot__delete"
            onClick={handleDelete}
            aria-label="Delete save"
            title="Delete this save"
          >
            &times;
          </button>
        )}
      </div>

      <div className="save-slot__content">
        <div className="save-slot__player">
          <span className="save-slot__name">{metadata.playerName}</span>
          <span className="save-slot__level">Lv.{metadata.playerLevel}</span>
        </div>

        {metadata.sceneName && (
          <div className="save-slot__scene">{metadata.sceneName}</div>
        )}

        <div className="save-slot__meta">
          <span className="save-slot__time">
            {formatPlayTime(metadata.playTimeSeconds)}
          </span>
          <span className="save-slot__date">
            {formatTimestamp(metadata.timestamp)}
          </span>
        </div>
      </div>

      {mode === 'save' && (
        <div className="save-slot__warning">Overwrite?</div>
      )}
    </button>
  );
}
