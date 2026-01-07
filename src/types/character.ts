/**
 * Character and enemy types for Dragon Gate
 * Defines player characters, NPCs, and enemies
 */

import type { StatBlock } from './stats';
import type { ItemDrop, InventoryItem } from './items';
import type { Modifier } from './modifiers';

/** AI behavior type for enemies */
export type AIBehavior = 'aggressive' | 'defensive' | 'balanced' | 'random' | 'scripted';

/** Player character definition */
export interface Character {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Base stat values */
  baseStats: StatBlock;
  /** Known skill IDs */
  skills: string[];
  /** Current level */
  level?: number;
  /** Current experience points */
  exp?: number;
  /** Current HP */
  currentHp?: number;
  /** Current MP */
  currentMp?: number;
  /** Computed current stats (after modifiers) */
  currentStats?: StatBlock;
  /** Equipment by slot */
  equipment?: Record<string, string>;
  /** Inventory items */
  inventory?: InventoryItem[];
  /** Active modifiers */
  modifiers?: Modifier[];
}

/** Enemy template definition */
export interface Enemy {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Base stat values */
  baseStats: StatBlock;
  /** Available skill IDs */
  skills: string[];
  /** Item drops on defeat */
  drops: ItemDrop[];
  /** Experience reward on defeat */
  exp: number;
  /** Gold reward on defeat */
  gold?: number;
  /** AI configuration */
  ai?: EnemyAIConfig;
}

/** Enemy AI configuration */
export interface EnemyAIConfig {
  /** Base behavior pattern */
  behavior: AIBehavior;
  /** HP percentage to start healing */
  healThreshold?: number;
  /** HP percentage to start defending */
  defendThreshold?: number;
  /** Target preference */
  preferTargets?: 'weakest' | 'strongest' | 'random';
  /** Ordered skill preferences */
  skillPriority?: string[];
}

/** NPC definition (non-combat characters) */
export interface NPC {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Portrait image path */
  portrait?: string;
  /** Dialog tree reference */
  dialogId?: string;
}
