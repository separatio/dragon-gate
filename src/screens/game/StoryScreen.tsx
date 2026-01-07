/**
 * Story Screen
 * Integrates scene engine with UI components for story mode gameplay
 */

import { useEffect, useContext, useCallback, useRef } from 'react';
import { BottomPanelContext, ChoiceOption } from '../../components/BottomPanel/BottomPanelContext';
import { LoadingSpinner } from '../../components/Loading';
import { useSceneEngine } from '../../hooks/useSceneEngine';
import { useGameLoader } from '../../hooks/useGameLoader';
import { useChoiceEvaluator } from '../../hooks/useChoiceEvaluator';
import { useAutoSave } from '../../hooks/useAutoSave';
import { ScreenContext, Screen } from '../../ScreenProvider';
import BattleScreen from './BattleScreen';
import type { Choice } from '../../types';

const DEFAULT_GAME_PATH = '/games/default/game.json';

export default function StoryScreen() {
  const screenContext = useContext(ScreenContext);
  const panelContext = useContext(BottomPanelContext);

  const { game, loading, error, load } = useGameLoader();
  const { state, start, advance, selectChoice, handleBattleEnd } = useSceneEngine(game);
  const { evaluate } = useChoiceEvaluator(game);
  const { isSaving, triggerAutoSave, config } = useAutoSave({
    gameId: game?.id ?? null,
    player: game?.characters.player ?? null,
    enabled: state.type !== 'battle',
  });

  // Track last scene ID to detect scene changes
  const lastSceneIdRef = useRef<string | null>(null);

  // Load game on mount
  useEffect(() => {
    load(DEFAULT_GAME_PATH);
  }, [load]);

  // Start game when loaded
  useEffect(() => {
    if (game && state.type === 'idle') {
      start();
    }
  }, [game, state.type, start]);

  // Auto-save on scene change
  useEffect(() => {
    if (!config.onSceneChange) return;
    if (state.type !== 'story' && state.type !== 'choices') return;

    const currentSceneId = state.scene?.id;
    if (!currentSceneId) return;

    // Only auto-save when entering a new scene
    if (currentSceneId !== lastSceneIdRef.current) {
      lastSceneIdRef.current = currentSceneId;
      // Use scene ID as name since Scene type doesn't have a name property
      triggerAutoSave(currentSceneId, currentSceneId);
    }
  }, [state, config.onSceneChange, triggerAutoSave]);

  // Handle text completion - advance to next content
  const handleTextComplete = useCallback(() => {
    // Text finished animating, user can now advance
  }, []);

  // Handle advancing through story content
  const handleAdvance = useCallback(() => {
    if (state.type === 'story') {
      advance();
    }
  }, [state.type, advance]);

  // Convert scene choices to panel format
  const convertChoices = useCallback(
    (choices: Choice[]): ChoiceOption[] => {
      // Get player character for evaluation (use default stats for now)
      const player = game?.characters.player;
      if (!player) {
        return choices.map((choice) => ({
          id: choice.id,
          text: choice.text,
          disabled: false,
          onSelect: () => selectChoice(choice.id),
        }));
      }

      const evaluated = evaluate(choices, player);
      return evaluated.map((choice) => ({
        id: choice.id,
        text: choice.text,
        disabled: !choice.available,
        onSelect: () => {
          if (choice.available) {
            selectChoice(choice.id);
          }
        },
      }));
    },
    [game, evaluate, selectChoice]
  );

  // Sync scene engine state to bottom panel
  useEffect(() => {
    if (!panelContext) return;

    if (state.type === 'story') {
      const content = state.scene.content?.[state.contentIndex];
      if (content?.type === 'text' && content.value) {
        panelContext.showText(content.value, content.speaker, handleTextComplete);
      }
    } else if (state.type === 'choices') {
      const panelChoices = convertChoices(state.choices);
      panelContext.showChoices(panelChoices);
    } else if (state.type === 'idle' || state.type === 'loading') {
      panelContext.clear();
    }
  }, [state, panelContext, convertChoices, handleTextComplete]);

  // Handle click to advance
  useEffect(() => {
    const handleClick = () => {
      if (state.type === 'story') {
        handleAdvance();
      }
    };

    // Add click listener to visual area
    const visualArea = document.querySelector('.visual-area');
    visualArea?.addEventListener('click', handleClick);

    return () => {
      visualArea?.removeEventListener('click', handleClick);
    };
  }, [state.type, handleAdvance]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (state.type === 'story') {
          e.preventDefault();
          handleAdvance();
        }
      }
      if (e.key === 'Escape') {
        // Return to menu
        screenContext?.setCurrentScreen(Screen.MainMenu);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.type, handleAdvance, screenContext]);

  // Loading state
  if (loading) {
    return (
      <div className="story-loading">
        <LoadingSpinner size="lg" label="Loading game..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="story-error">
        <h2>Error Loading Game</h2>
        <p>{error}</p>
        <button
          className="btn btn-primary"
          onClick={() => screenContext?.setCurrentScreen(Screen.MainMenu)}
        >
          Return to Menu
        </button>
      </div>
    );
  }

  // Battle mode - delegate to BattleScreen
  if (state.type === 'battle' && game) {
    return (
      <BattleScreen
        scene={state.scene}
        game={game}
        player={game.characters.player}
        onBattleEnd={handleBattleEnd}
      />
    );
  }

  // Show advance hint during story
  const showAdvanceHint = state.type === 'story';

  return (
    <>
      {/* Auto-save indicator */}
      {isSaving && (
        <div className="auto-save-indicator">
          <span className="auto-save-indicator__icon">💾</span>
          <span className="auto-save-indicator__text">Saving...</span>
        </div>
      )}

      {showAdvanceHint && (
        <div className="story-advance-hint">Click or press Enter to continue</div>
      )}
    </>
  );
}
