/**
 * Bottom Panel Component
 * Swappable content area for text, choices, actions, and selections
 */

import { ReactNode, useState, useCallback, useMemo, useContext } from 'react';
import {
  BottomPanelContext,
  BottomPanelContextValue,
  PanelState,
  ChoiceOption,
  ActionOption,
  SkillOption,
  ItemOption,
  TargetOption,
} from './BottomPanelContext';
import TextDisplay from './panels/TextDisplay';
import ActionPanel from './panels/ActionPanel';
import SkillPanel from './panels/SkillPanel';
import ItemPanel from './panels/ItemPanel';
import TargetPanel from './panels/TargetPanel';
import ChoicePanel from './panels/ChoicePanel';

interface BottomPanelProviderProps {
  children: ReactNode;
}

/**
 * BottomPanelProvider
 * Provides panel state and control methods to the component tree
 */
export function BottomPanelProvider({ children }: BottomPanelProviderProps) {
  const [state, setState] = useState<PanelState>({ type: 'empty' });

  const showText = useCallback(
    (content: string, speaker?: string, onComplete?: () => void) => {
      setState({ type: 'text', content, speaker, onComplete });
    },
    []
  );

  const showChoices = useCallback((choices: ChoiceOption[]) => {
    setState({ type: 'choice', choices });
  }, []);

  const showActions = useCallback((actions: ActionOption[]) => {
    setState({ type: 'action', actions });
  }, []);

  const showSkills = useCallback(
    (
      skills: SkillOption[],
      categories: string[],
      onSelect: (id: string) => void,
      onBack: () => void
    ) => {
      setState({ type: 'skill', skills, categories, onSelect, onBack });
    },
    []
  );

  const showItems = useCallback(
    (
      items: ItemOption[],
      categories: string[],
      onSelect: (id: string) => void,
      onBack: () => void
    ) => {
      setState({ type: 'item', items, categories, onSelect, onBack });
    },
    []
  );

  const showTargets = useCallback(
    (targets: TargetOption[], onSelect: (id: string) => void, onBack: () => void) => {
      setState({ type: 'target', targets, onSelect, onBack });
    },
    []
  );

  const clear = useCallback(() => {
    setState({ type: 'empty' });
  }, []);

  const value: BottomPanelContextValue = useMemo(
    () => ({
      state,
      setState,
      showText,
      showChoices,
      showActions,
      showSkills,
      showItems,
      showTargets,
      clear,
    }),
    [state, showText, showChoices, showActions, showSkills, showItems, showTargets, clear]
  );

  return <BottomPanelContext.Provider value={value}>{children}</BottomPanelContext.Provider>;
}

/**
 * BottomPanel
 * Renders the appropriate content based on panel state
 */
export function BottomPanel() {
  const context = useContext(BottomPanelContext);

  if (!context) {
    throw new Error('BottomPanel must be used within a BottomPanelProvider');
  }

  const renderContent = () => {
    switch (context.state.type) {
      case 'empty':
        return null;

      case 'text':
        return (
          <TextDisplay
            content={context.state.content}
            speaker={context.state.speaker}
            onComplete={context.state.onComplete}
          />
        );

      case 'choice':
        return <ChoicePanel choices={context.state.choices} />;

      case 'action':
        return <ActionPanel actions={context.state.actions} />;

      case 'skill':
        return (
          <SkillPanel
            skills={context.state.skills}
            categories={context.state.categories}
            onSelect={context.state.onSelect}
            onBack={context.state.onBack}
          />
        );

      case 'item':
        return (
          <ItemPanel
            items={context.state.items}
            categories={context.state.categories}
            onSelect={context.state.onSelect}
            onBack={context.state.onBack}
          />
        );

      case 'target':
        return (
          <TargetPanel
            targets={context.state.targets}
            onSelect={context.state.onSelect}
            onBack={context.state.onBack}
          />
        );
    }
  };

  return (
    <div className="bottom-panel">
      <div className="content-container h-full">{renderContent()}</div>
    </div>
  );
}
