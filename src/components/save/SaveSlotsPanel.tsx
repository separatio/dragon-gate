/**
 * Save Slots Panel Component
 * Displays a grid of save slots for save/load operations
 */

import { useState, useEffect, useCallback } from 'react';
import SaveSlotCard from './SaveSlotCard';
import { SaveManager } from '../../services/SaveManager';
import type { SaveSlotInfo } from '../../types/save';

interface SaveSlotsPanelProps {
  /** Whether in save or load mode */
  mode: 'save' | 'load';
  /** Called when a slot is selected for action */
  onSlotSelect: (slot: number) => void;
  /** Called when cancel is pressed */
  onCancel: () => void;
  /** Title for the panel */
  title?: string;
}

export default function SaveSlotsPanel({
  mode,
  onSlotSelect,
  onCancel,
  title,
}: SaveSlotsPanelProps) {
  const [slots, setSlots] = useState<SaveSlotInfo[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Load slot info on mount
  useEffect(() => {
    setSlots(SaveManager.getAllSlotInfo());
  }, []);

  // Handle slot click
  const handleSelect = useCallback((slot: number) => {
    setSelectedSlot(slot);
    setConfirmDelete(null);
  }, []);

  // Handle confirm button
  const handleConfirm = useCallback(() => {
    if (selectedSlot !== null) {
      onSlotSelect(selectedSlot);
    }
  }, [selectedSlot, onSlotSelect]);

  // Handle delete request
  const handleDeleteRequest = useCallback((slot: number) => {
    setConfirmDelete(slot);
  }, []);

  // Confirm delete
  const handleConfirmDelete = useCallback(() => {
    if (confirmDelete !== null) {
      SaveManager.delete(confirmDelete);
      setSlots(SaveManager.getAllSlotInfo());
      setConfirmDelete(null);
      if (selectedSlot === confirmDelete) {
        setSelectedSlot(null);
      }
    }
  }, [confirmDelete, selectedSlot]);

  // Cancel delete
  const handleCancelDelete = useCallback(() => {
    setConfirmDelete(null);
  }, []);

  // Check if confirm button should be enabled
  const canConfirm = selectedSlot !== null && (
    mode === 'save' || !slots[selectedSlot]?.isEmpty
  );

  return (
    <div className="save-slots-panel">
      <div className="save-slots-panel__header">
        <h2 className="save-slots-panel__title">
          {title ?? (mode === 'save' ? 'Save Game' : 'Load Game')}
        </h2>
        <button
          className="save-slots-panel__close"
          onClick={onCancel}
          aria-label="Close"
        >
          &times;
        </button>
      </div>

      {/* Delete confirmation dialog */}
      {confirmDelete !== null && (
        <div className="save-slots-panel__confirm-dialog">
          <p>Delete save in Slot {confirmDelete + 1}?</p>
          <div className="save-slots-panel__confirm-buttons">
            <button
              className="btn btn-secondary"
              onClick={handleCancelDelete}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConfirmDelete}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="save-slots-panel__grid">
        {slots.map((info, index) => (
          <SaveSlotCard
            key={index}
            slot={index}
            info={info}
            mode={mode}
            onSelect={handleSelect}
            onDelete={mode === 'load' ? handleDeleteRequest : undefined}
            isSelected={selectedSlot === index}
          />
        ))}
      </div>

      <div className="save-slots-panel__actions">
        <button
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={!canConfirm}
        >
          {mode === 'save' ? 'Save' : 'Load'}
        </button>
      </div>
    </div>
  );
}
