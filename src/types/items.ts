/**
 * Item system types for Dragon Gate
 * Defines consumables, equipment, and inventory
 */

/** Type of item */
export type ItemType = 'consumable' | 'equipment' | 'key' | 'material';

/** Equipment slot */
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory' | 'head' | 'hands' | 'feet';

/** Effect type for consumable items */
export type ItemEffectType = 'healHp' | 'healMp' | 'revive' | 'buff' | 'damage' | 'cure' | 'none';

/** Base item definition */
export interface Item {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Item description */
  description: string;
  /** Type of item */
  type: ItemType;
  /** Effect when used */
  effect: ItemEffectType;
  /** Effect value (HP restored, damage dealt, etc.) */
  value: number;
  /** Target type when used in battle */
  target?: 'single' | 'all' | 'self';
  /** Stat to buff (for buff items) */
  buffStat?: string;
  /** Buff value */
  buffValue?: number;
  /** Buff duration in turns */
  buffDuration?: number;
  /** Category for UI filtering */
  category?: string;
  /** Whether item can stack in inventory */
  stackable?: boolean;
  /** Maximum stack size */
  maxStack?: number;
}

/** Equipment item with stat bonuses */
export interface EquipmentItem extends Omit<Item, 'effect' | 'value'> {
  type: 'equipment';
  /** Equipment slot */
  slot: EquipmentSlot;
  /** Stat modifiers when equipped */
  modifiers: EquipmentModifier[];
  /** Stat requirements to equip */
  requirements?: Record<string, number>;
}

/** A modifier provided by equipment */
export interface EquipmentModifier {
  /** Stat to modify */
  stat: string;
  /** Flat or percentage bonus */
  type: 'flat' | 'percent';
  /** Value of the bonus */
  value: number;
}

/** Item drop configuration for enemies */
export interface ItemDrop {
  /** Item ID */
  itemId: string;
  /** Drop chance (0-100) */
  chance: number;
  /** Quantity to drop */
  count?: number;
}

/** Inventory item with quantity */
export interface InventoryItem {
  /** Item ID */
  id: string;
  /** Quantity owned */
  count: number;
}
