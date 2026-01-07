/**
 * Main Menu Screen
 * Entry point with New Game, Continue, Load, and Options
 */

import { useState, useContext, useEffect } from 'react';
import { ScreenContext, Screen } from '../../ScreenProvider';
import { invoke } from '@tauri-apps/api/core';
import { SaveManager } from '../../services/SaveManager';
import LoadGameModal from '../modals/LoadGameModal';

function MainMenuScreen() {
  const context = useContext(ScreenContext);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [hasSaveData, setHasSaveData] = useState(false);
  const [mostRecentSlot, setMostRecentSlot] = useState<number | null>(null);

  // Check for existing saves on mount
  useEffect(() => {
    const slot = SaveManager.getMostRecentSlot();
    setMostRecentSlot(slot);
    setHasSaveData(slot !== null);
  }, []);

  if (!context) {
    return <div className="main-menu__error">ScreenContext is not available.</div>;
  }

  const { setCurrentScreen } = context;

  const handleNewGame = () => {
    setCurrentScreen(Screen.Story);
  };

  const handleContinue = () => {
    if (mostRecentSlot === null) return;

    const result = SaveManager.load(mostRecentSlot);
    if (result.success && result.data) {
      SaveManager.applyToGame(result.data);
      setCurrentScreen(Screen.Story);
    }
  };

  const handleLoadGame = () => {
    setShowLoadModal(true);
  };

  const handleLoadComplete = () => {
    setShowLoadModal(false);
    setCurrentScreen(Screen.Story);
  };

  const handleOptions = () => {
    // Options screen will be implemented in future plans
    alert('Options coming soon!');
  };

  const handleQuit = () => {
    invoke('exit_app');
  };

  return (
    <div className="main-menu">
      <div className="main-menu__content">
        <h1 className="main-menu__title">Dragon Gate</h1>
        <p className="main-menu__subtitle">A Text RPG Adventure</p>

        <nav className="main-menu__nav">
          {hasSaveData && (
            <button
              className="main-menu__button main-menu__button--primary"
              onClick={handleContinue}
            >
              Continue
            </button>
          )}

          <button
            className="main-menu__button"
            onClick={handleNewGame}
          >
            New Game
          </button>

          <button
            className="main-menu__button"
            onClick={handleLoadGame}
          >
            Load Game
          </button>

          <button
            className="main-menu__button"
            onClick={handleOptions}
          >
            Options
          </button>

          <button
            className="main-menu__button main-menu__button--danger"
            onClick={handleQuit}
          >
            Quit
          </button>
        </nav>
      </div>

      {showLoadModal && (
        <LoadGameModal
          onLoad={handleLoadComplete}
          onClose={() => setShowLoadModal(false)}
        />
      )}
    </div>
  );
}

export default MainMenuScreen;
