/**
 * Bottom Panel Context
 * Manages the state of the swappable bottom panel content
 */

import { createContext } from 'react';

/** Panel state discriminated union */
export type PanelState =
  | { type: 'empty' }
  | { type: 'text'; content: string; speaker?: string; onComplete?: () => void }
  | { type: 'choice'; choices: ChoiceOption[] }
  | { type: 'action'; actions: ActionOption[] }
  | {
      type: 'skill';
      skills: SkillOption[];
      categories: string[];
      onSelect: (skillId: string) => void;
      onBack: () => void;
    }
  | {
      type: 'item';
      items: ItemOption[];
      categories: string[];
      onSelect: (itemId: string) => void;
      onBack: () => void;
    }
  | {
      type: 'target';
      targets: TargetOption[];
      onSelect: (targetId: string) => void;
      onBack: () => void;
    };

/** A story choice option */
export interface ChoiceOption {
  id: string;
  text: string;
  disabled?: boolean;
  onSelect: () => void;
}

/** A battle action option */
export interface ActionOption {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  onSelect: () => void;
}

/** A skill option for selection */
export interface SkillOption {
  id: string;
  name: string;
  category: string;
  cost: number;
  costType: 'MP' | 'HP';
  disabled?: boolean;
  description?: string;
}

/** An item option for selection */
export interface ItemOption {
  id: string;
  name: string;
  category: string;
  quantity: number;
  disabled?: boolean;
  description?: string;
}

/** A target option for selection */
export interface TargetOption {
  id: string;
  name: string;
  type: 'enemy' | 'ally';
  currentHP?: number;
  maxHP?: number;
}

/** Context value shape */
export interface BottomPanelContextValue {
  /** Current panel state */
  state: PanelState;
  /** Set panel state directly */
  setState: (state: PanelState) => void;
  /** Show text display */
  showText: (content: string, speaker?: string, onComplete?: () => void) => void;
  /** Show choice buttons */
  showChoices: (choices: ChoiceOption[]) => void;
  /** Show action buttons */
  showActions: (actions: ActionOption[]) => void;
  /** Show skill selection */
  showSkills: (
    skills: SkillOption[],
    categories: string[],
    onSelect: (id: string) => void,
    onBack: () => void
  ) => void;
  /** Show item selection */
  showItems: (
    items: ItemOption[],
    categories: string[],
    onSelect: (id: string) => void,
    onBack: () => void
  ) => void;
  /** Show target selection */
  showTargets: (
    targets: TargetOption[],
    onSelect: (id: string) => void,
    onBack: () => void
  ) => void;
  /** Clear panel (show empty) */
  clear: () => void;
}

/** Bottom panel context - null when outside provider */
export const BottomPanelContext = createContext<BottomPanelContextValue | null>(null);
