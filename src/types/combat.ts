/**
 * Combat system types for Dragon Gate
 * Defines combat state, phases, and actions
 */

import type { StatBlock } from './stats';
import type { ActiveModifier } from './modifiers';

/** Combat phase */
export type CombatPhase =
  | 'start'
  | 'turn_start'
  | 'action_select'
  | 'target_select'
  | 'action_execute'
  | 'turn_end'
  | 'victory'
  | 'defeat'
  | 'dialog';

/** Type of combat action */
export type CombatActionType = 'skill' | 'item' | 'defend' | 'flee';

/** A combat action */
export interface CombatAction {
  /** Type of action */
  type: CombatActionType;
  /** ID of the acting combatant */
  actorId: string;
  /** Skill ID (for skill actions) */
  skillId?: string;
  /** Item ID (for item actions) */
  itemId?: string;
  /** Target combatant IDs */
  targetIds?: string[];
}

/** State of a combatant during battle */
export interface Combatant {
  /** Unique identifier (may include instance suffix) */
  id: string;
  /** Display name */
  name: string;
  /** Whether this is a player character */
  isPlayer: boolean;
  /** Base stats before modifiers */
  baseStats: StatBlock;
  /** Current computed stats */
  currentStats: StatBlock;
  /** Current HP */
  currentHp: number;
  /** Current MP */
  currentMp: number;
  /** Maximum HP */
  maxHp: number;
  /** Maximum MP */
  maxMp: number;
  /** Available skill IDs */
  skills: string[];
  /** Active modifiers */
  modifiers: ActiveModifier[];
  /** Whether currently defending */
  isDefending: boolean;
  /** Whether alive */
  isAlive: boolean;
}

/** Entry in the turn queue */
export interface TurnQueueEntry {
  /** Combatant ID */
  combatantId: string;
  /** Calculated initiative */
  initiative: number;
}

/** Dialog entry for battle dialog */
export interface DialogEntry {
  /** Speaker name */
  speaker: string;
  /** Dialog text */
  text: string;
}

/** Complete combat state snapshot */
export interface CombatSnapshot {
  /** Current phase */
  phase: CombatPhase;
  /** Current turn number */
  turnNumber: number;
  /** Index in turn queue */
  currentTurnIndex: number;
  /** Turn order */
  turnQueue: TurnQueueEntry[];
  /** All combatants */
  combatants: Map<string, Combatant>;
  /** Pending action awaiting execution */
  pendingAction: CombatAction | null;
  /** Battle log messages */
  battleLog: string[];
  /** Queued dialogs */
  dialogQueue: DialogEntry[];
  /** Battle result (set when victory/defeat) */
  battleResult?: BattleResult;
}

/** Result of a completed battle */
export interface BattleResult {
  /** Whether player won */
  victory: boolean;
  /** Rewards if victorious */
  rewards?: BattleRewards;
  /** Surviving player data */
  survivingPlayers: SurvivorData[];
  /** Total turns taken */
  turnCount: number;
}

/** Rewards from winning a battle */
export interface BattleRewards {
  /** Experience points earned */
  exp: number;
  /** Gold earned */
  gold: number;
  /** Items dropped */
  items: DroppedItem[];
}

/** An item dropped from battle */
export interface DroppedItem {
  /** Item ID */
  itemId: string;
  /** Quantity dropped */
  count: number;
}

/** Survivor data after battle */
export interface SurvivorData {
  /** Character ID */
  id: string;
  /** Character name */
  name: string;
  /** Remaining HP */
  remainingHp: number;
  /** Maximum HP */
  maxHp: number;
  /** Remaining MP */
  remainingMp: number;
  /** Maximum MP */
  maxMp: number;
}

/** Result of an action execution */
export interface ActionResult {
  /** Whether action succeeded */
  success: boolean;
  /** Result message */
  message: string;
  /** Individual effects applied */
  effects: ActionEffect[];
}

/** An individual effect from an action */
export interface ActionEffect {
  /** Target combatant ID */
  targetId: string;
  /** Type of effect */
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'status';
  /** Numeric value */
  value: number;
  /** Whether this was a critical hit */
  isCritical?: boolean;
  /** Stat affected (for buff/debuff) */
  statAffected?: string;
}

/** Damage calculation result */
export interface DamageResult {
  /** Final damage value */
  damage: number;
  /** Whether critical hit */
  isCritical: boolean;
  /** Raw damage before mitigation */
  rawDamage: number;
  /** Amount mitigated by defense */
  mitigatedBy: number;
}
