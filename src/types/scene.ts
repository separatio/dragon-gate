/**
 * Scene and story types for Dragon Gate
 * Defines scenes, dialog, choices, and narrative flow
 */

/** Type of scene */
export type SceneType = 'story' | 'battle';

/** Type of content within a scene */
export type ContentType = 'text' | 'choice' | 'setVariable' | 'checkVariable';

/** A scene in the game */
export interface Scene {
  /** Unique identifier */
  id: string;
  /** Type of scene */
  type: SceneType;
  /** Content blocks for story scenes */
  content?: SceneContent[];
  /** Available choices after content */
  choices?: Choice[];
  /** Enemy IDs for battle scenes */
  enemies?: string[];
  /** Background identifier */
  background?: string;
  /** Scene to go to on victory (battle scenes) */
  victoryScene?: string;
  /** Scene to go to on defeat (battle scenes) */
  defeatScene?: string;
  /** Battle triggers (battle scenes) */
  triggers?: BattleTrigger[];
}

/** Content block within a scene */
export interface SceneContent {
  /** Type of content */
  type: ContentType;
  /** Text content (for 'text' type) */
  value?: string;
  /** Speaker name (for dialog) */
  speaker?: string;
  /** Variable name (for variable operations) */
  variable?: string;
  /** Variable value to set */
  setValue?: string | number | boolean;
  /** Condition to check */
  condition?: string;
  /** Content to show if condition is true */
  ifTrue?: SceneContent[];
  /** Content to show if condition is false */
  ifFalse?: SceneContent[];
}

/** A player choice */
export interface Choice {
  /** Unique identifier */
  id: string;
  /** Display text */
  text: string;
  /** Scene to transition to */
  nextScene?: string;
  /** Condition for showing this choice (formula string) */
  condition?: string;
  /** Formula for when to show the choice */
  showIf?: string;
  /** Requirements to be available */
  requires?: ChoiceRequirements;
  /** Variables to set when selected */
  effects?: Record<string, unknown>;
  /** Items to consume when selected */
  consumeItems?: ConsumeItem[];
  /** Whether choice is currently available (computed) */
  available?: boolean;
}

/** Requirements for a choice to be available */
export interface ChoiceRequirements {
  /** Minimum stat values */
  stats?: Record<string, number>;
  /** Required items */
  items?: ConsumeItem[];
  /** Required story flags */
  flags?: Record<string, boolean | string | number>;
  /** Required skills */
  skills?: string[];
}

/** Item consumption specification */
export interface ConsumeItem {
  /** Item ID */
  id: string;
  /** Quantity to consume */
  count?: number;
}

/** Battle trigger for mid-battle events */
export interface BattleTrigger {
  /** Optional identifier */
  id?: string;
  /** Condition formula (e.g., "enemy.hpPercent < 30") */
  condition: string;
  /** Fire only once */
  once?: boolean;
  /** Maximum times to fire */
  maxFires?: number;
  /** Action to execute */
  action: BattleTriggerAction;
}

/**
 * A choice within battle dialog
 * When selected, executes an optional action and advances dialog
 */
export interface BattleDialogChoice {
  /** Unique identifier for this choice */
  id: string;
  /** Display text for the choice button */
  text: string;
  /** Optional action to execute when selected */
  action?: BattleTriggerAction;
}

/** Action executed by a battle trigger */
export type BattleTriggerAction =
  | { type: 'dialog'; speaker?: string; text: string; choices?: BattleDialogChoice[] }
  | { type: 'spawn'; enemyId: string }
  | { type: 'buff'; target?: string; stat: string; value: number; duration?: number }
  | { type: 'heal'; target?: string; amount: number }
  | { type: 'damage'; target?: string; amount: number }
  | { type: 'flee'; target?: string }
  | { type: 'transform'; target?: string; newEnemyId: string }
  | { type: 'multi'; actions: BattleTriggerAction[] };
