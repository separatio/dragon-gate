/**
 * Save Game Modal
 * Modal for saving game progress to a slot
 */

import { useCallback } from 'react';
import { SaveSlotsPanel } from '../../components/save';
import { SaveManager } from '../../services/SaveManager';
import { useGameLoader } from '../../hooks/useGameLoader';

interface SaveGameModalProps {
  /** Current scene ID */
  currentSceneId: string;
  /** Current scene name for display */
  sceneName?: string;
  /** Called when modal should close */
  onClose: () => void;
}

export default function SaveGameModal({
  currentSceneId,
  sceneName,
  onClose,
}: SaveGameModalProps) {
  const { game } = useGameLoader();

  const handleSlotSelect = useCallback(
    (slot: number) => {
      if (!game) {
        console.error('No game loaded');
        return;
      }

      const result = SaveManager.save(
        slot,
        game.id,
        game.characters.player,
        currentSceneId,
        sceneName
      );

      if (result.success) {
        onClose();
      } else {
        // Could show error toast here
        console.error('Save failed:', result.error);
      }
    },
    [game, currentSceneId, sceneName, onClose]
  );

  // Can't save if no game loaded
  if (!game) {
    return (
      <div className="modal-overlay">
        <div className="modal modal--error">
          <h2>Cannot Save</h2>
          <p>No game is currently loaded.</p>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal modal--save">
        <SaveSlotsPanel
          mode="save"
          onSlotSelect={handleSlotSelect}
          onCancel={onClose}
          title="Save Game"
        />
      </div>
    </div>
  );
}
