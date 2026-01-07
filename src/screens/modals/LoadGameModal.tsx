/**
 * Load Game Modal
 * Modal for loading game from a save slot
 */

import { useCallback } from 'react';
import { SaveSlotsPanel } from '../../components/save';
import { SaveManager } from '../../services/SaveManager';

interface LoadGameModalProps {
  /** Called when a save is successfully loaded */
  onLoad: (sceneId: string) => void;
  /** Called when modal should close */
  onClose: () => void;
}

export default function LoadGameModal({ onLoad, onClose }: LoadGameModalProps) {
  const handleSlotSelect = useCallback(
    (slot: number) => {
      const result = SaveManager.load(slot);

      if (!result.success || !result.data) {
        // Could show error toast here
        console.error('Load failed:', result.error);
        return;
      }

      // Apply save data to game state
      const { sceneId } = SaveManager.applyToGame(result.data);

      // Close modal and trigger scene transition
      onClose();
      onLoad(sceneId);
    },
    [onLoad, onClose]
  );

  return (
    <div className="modal-overlay">
      <div className="modal modal--load">
        <SaveSlotsPanel
          mode="load"
          onSlotSelect={handleSlotSelect}
          onCancel={onClose}
          title="Load Game"
        />
      </div>
    </div>
  );
}
