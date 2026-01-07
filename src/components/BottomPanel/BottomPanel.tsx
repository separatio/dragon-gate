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
        return <ChoicePanelPlaceholder choices={context.state.choices} />;

      case 'action':
        return <ActionPanel actions={context.state.actions} />;

      case 'skill':
        return (
          <SkillPanelPlaceholder
            skills={context.state.skills}
            onSelect={context.state.onSelect}
            onBack={context.state.onBack}
          />
        );

      case 'item':
        return (
          <ItemPanelPlaceholder
            items={context.state.items}
            onSelect={context.state.onSelect}
            onBack={context.state.onBack}
          />
        );

      case 'target':
        return (
          <TargetPanelPlaceholder
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

// ============================================================================
// Placeholder Components (will be replaced in later plans)
// ============================================================================

interface ChoicePanelPlaceholderProps {
  choices: ChoiceOption[];
}

function ChoicePanelPlaceholder({ choices }: ChoicePanelPlaceholderProps) {
  return (
    <div className="h-full flex flex-col justify-center gap-2 p-4">
      {choices.map((choice) => (
        <button
          key={choice.id}
          className="btn btn-secondary w-full"
          onClick={choice.onSelect}
          disabled={choice.disabled}
        >
          {choice.text}
        </button>
      ))}
    </div>
  );
}

interface SkillPanelPlaceholderProps {
  skills: SkillOption[];
  onSelect: (id: string) => void;
  onBack: () => void;
}

function SkillPanelPlaceholder({ skills, onBack }: SkillPanelPlaceholderProps) {
  return (
    <div className="h-full flex items-center justify-between p-4">
      <button className="btn btn-secondary" onClick={onBack}>
        Back
      </button>
      <p className="text-muted">Skills: {skills.length} available (Plan 013)</p>
    </div>
  );
}

interface ItemPanelPlaceholderProps {
  items: ItemOption[];
  onSelect: (id: string) => void;
  onBack: () => void;
}

function ItemPanelPlaceholder({ items, onBack }: ItemPanelPlaceholderProps) {
  return (
    <div className="h-full flex items-center justify-between p-4">
      <button className="btn btn-secondary" onClick={onBack}>
        Back
      </button>
      <p className="text-muted">Items: {items.length} available (Plan 014)</p>
    </div>
  );
}

interface TargetPanelPlaceholderProps {
  targets: TargetOption[];
  onSelect: (id: string) => void;
  onBack: () => void;
}

function TargetPanelPlaceholder({ targets, onBack }: TargetPanelPlaceholderProps) {
  return (
    <div className="h-full flex items-center justify-between p-4">
      <button className="btn btn-secondary" onClick={onBack}>
        Back
      </button>
      <p className="text-muted">Targets: {targets.length} available (Plan 015)</p>
    </div>
  );
}
