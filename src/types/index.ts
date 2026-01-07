/**
 * Dragon Gate Type Definitions
 * Central export for all game types
 */

// Theme types
export type {
  ThemeConfig,
  ThemeColors,
  TextboxConfig,
  TypographyConfig,
} from './theme';

// Stat types
export type {
  StatDefinition,
  DerivedStatDefinition,
  StatBlock,
  CombatFormulas,
  StatsConfig,
} from './stats';

// Modifier types
export type {
  ModifierSource,
  ModifierValueType,
  Modifier,
  ActiveModifier,
  ModifierDefinition,
  ModifierEffect,
} from './modifiers';

// Skill types
export type {
  SkillType,
  TargetType,
  Skill,
  SkillBuffEffect,
  SkillDebuffEffect,
  SkillRequirements,
} from './skills';

// Item types
export type {
  ItemType,
  EquipmentSlot,
  ItemEffectType,
  Item,
  EquipmentItem,
  EquipmentModifier,
  ItemDrop,
  InventoryItem,
} from './items';

// Character types
export type {
  AIBehavior,
  Character,
  Enemy,
  EnemyAIConfig,
  NPC,
} from './character';

// Scene types
export type {
  SceneType,
  ContentType,
  Scene,
  SceneContent,
  Choice,
  ChoiceRequirements,
  ConsumeItem,
  BattleTrigger,
  BattleTriggerAction,
} from './scene';

// Combat types
export type {
  CombatPhase,
  CombatActionType,
  CombatAction,
  Combatant,
  TurnQueueEntry,
  DialogEntry,
  CombatSnapshot,
  BattleResult,
  BattleRewards,
  DroppedItem,
  SurvivorData,
  ActionResult,
  ActionEffect,
  DamageResult,
} from './combat';

// Game types
export type {
  GameDefinition,
  GameSettings,
} from './game';

export { DEFAULT_GAME_SETTINGS } from './game';

// Save types
export type {
  SavedPlayerData,
  SavedStoryData,
  SaveMetadata,
  SaveData,
  SaveSlotInfo,
  SaveResult,
  LoadResult,
  AutoSaveConfig,
} from './save';

export {
  SAVE_VERSION,
  DEFAULT_AUTO_SAVE_CONFIG,
  SAVE_STORAGE_KEYS,
  MAX_SAVE_SLOTS,
  createEmptySaveSlotInfo,
  formatPlayTime,
  formatTimestamp,
} from './save';
