/**
 * Combat State Machine
 * Manages battle flow: turn order, phases, action selection, and resolution
 */

import type { Character, Enemy } from '../../types/character';
import type { Scene } from '../../types/scene';
import type { StatBlock } from '../../types/stats';
import type { GameDefinition } from '../../types/game';
import { StatEngine } from '../stats/StatEngine';
import { ModifierStack } from '../stats/ModifierStack';
import { ActionExecutor, ActionEffect } from './ActionExecutor';
import { EnemyAI } from './EnemyAI';
import { BattleTriggerEngine } from './BattleTriggerEngine';
import type { BattleTriggerAction, BattleDialogChoice } from '../../types/scene';
import type { BattleResult, BattleRewards, DroppedItem, SurvivorData } from '../../types/combat';
import type { ItemDrop } from '../../types/items';

/**
 * Combat phases representing the state machine states
 */
export type CombatPhase =
  | 'start'           // Battle initialization
  | 'turn_start'      // Beginning of a turn
  | 'action_select'   // Player selecting action
  | 'target_select'   // Player selecting target
  | 'action_execute'  // Executing selected action
  | 'turn_end'        // End of turn processing
  | 'victory'         // Player won
  | 'defeat'          // Player lost
  | 'fled'            // Player fled successfully
  | 'dialog';         // Mid-battle dialog from trigger

/**
 * Runtime state for a combatant during battle
 */
export interface Combatant {
  /** Unique identifier (may include index for multiple enemies) */
  id: string;
  /** Display name */
  name: string;
  /** Whether this is a player character */
  isPlayer: boolean;
  /** Original base stats */
  baseStats: StatBlock;
  /** Current stats (after modifiers) */
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
  /** Active modifier stack */
  modifiers: ModifierStack;
  /** Whether currently defending */
  isDefending: boolean;
  /** Whether still alive */
  isAlive: boolean;
  /** Level (for stat calculations) */
  level: number;
}

/**
 * Action types available in combat
 */
export type CombatActionType = 'skill' | 'item' | 'defend' | 'flee';

/**
 * Represents a combat action to be executed
 */
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

/**
 * Turn queue entry with initiative value
 */
export interface TurnQueueEntry {
  /** Combatant ID */
  combatantId: string;
  /** Calculated initiative (higher = faster) */
  initiative: number;
}

/**
 * Mid-battle dialog entry
 */
export interface DialogEntry {
  /** Speaker name (empty for narrator) */
  speaker: string;
  /** Dialog text */
  text: string;
  /** Optional choices for player response */
  choices?: BattleDialogChoice[];
}

/**
 * Immutable snapshot of combat state for React
 */
export interface CombatSnapshot {
  /** Current phase */
  phase: CombatPhase;
  /** Current turn number */
  turnNumber: number;
  /** Index in turn queue */
  currentTurnIndex: number;
  /** Turn order queue */
  turnQueue: TurnQueueEntry[];
  /** All combatants */
  combatants: Map<string, Combatant>;
  /** Pending action (during selection) */
  pendingAction: CombatAction | null;
  /** Battle log messages */
  battleLog: string[];
  /** Queued dialog entries */
  dialogQueue: DialogEntry[];
  /** Current dialog entry (if in dialog phase) */
  currentDialog: DialogEntry | null;
  /** Battle result (set when victory/defeat) */
  battleResult: BattleResult | null;
}

/**
 * Combat State Machine
 *
 * Manages the entire battle lifecycle from initialization to victory/defeat.
 * Uses a subscription pattern for React integration.
 */
export class CombatStateMachine {
  private phase: CombatPhase = 'start';
  private turnNumber: number = 0;
  private turnQueue: TurnQueueEntry[] = [];
  private currentTurnIndex: number = 0;
  private combatants: Map<string, Combatant> = new Map();
  private pendingAction: CombatAction | null = null;
  private battleLog: string[] = [];
  private dialogQueue: DialogEntry[] = [];
  private battleResult: BattleResult | null = null;
  private previousPhase: CombatPhase = 'start';

  private statEngine: StatEngine;
  private actionExecutor: ActionExecutor;
  private enemyAI: EnemyAI;
  private triggerEngine: BattleTriggerEngine;
  private game: GameDefinition;
  private scene: Scene;
  private enemyDefinitions: Map<string, Enemy> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor(statEngine: StatEngine, game: GameDefinition, scene: Scene) {
    this.statEngine = statEngine;
    this.game = game;
    this.scene = scene;
    this.actionExecutor = new ActionExecutor(game);
    this.enemyAI = new EnemyAI(game);
    this.triggerEngine = new BattleTriggerEngine(game);

    // Initialize triggers from scene
    if (scene.triggers) {
      this.triggerEngine.setTriggers(scene.triggers);
    }
  }

  /**
   * Initialize battle with player and enemies
   */
  initialize(player: Character, enemies: Enemy[]): void {
    this.combatants.clear();
    this.enemyDefinitions.clear();
    this.battleLog = [];
    this.dialogQueue = [];
    this.pendingAction = null;
    this.battleResult = null;

    // Create player combatant
    const playerCombatant = this.createCombatant(player, true);
    this.combatants.set(playerCombatant.id, playerCombatant);

    // Create enemy combatants (with index suffix for duplicates)
    enemies.forEach((enemy, index) => {
      const enemyId = enemies.filter((e, i) => e.id === enemy.id && i < index).length > 0
        ? `${enemy.id}_${index}`
        : enemy.id;

      const enemyCombatant = this.createCombatant(
        { ...enemy, id: enemyId },
        false
      );
      this.combatants.set(enemyCombatant.id, enemyCombatant);

      // Store enemy definition for AI config lookup
      this.enemyDefinitions.set(enemyId, enemy);
    });

    this.phase = 'start';
    this.turnNumber = 0;
    this.log('Battle Start!');
    this.emit();
  }

  /**
   * Start the battle after initialization
   */
  start(): void {
    this.calculateTurnOrder();
    this.turnNumber = 1;
    this.currentTurnIndex = 0;
    this.startTurn();
  }

  /**
   * Calculate turn order based on speed stats
   */
  private calculateTurnOrder(): void {
    this.turnQueue = [];

    this.combatants.forEach((combatant) => {
      if (!combatant.isAlive) return;

      // Use Speed stat with small random variance
      const speed = combatant.currentStats.Speed ?? combatant.currentStats.speed ?? 10;
      const variance = Math.floor(Math.random() * 10);
      const initiative = speed + variance;

      this.turnQueue.push({
        combatantId: combatant.id,
        initiative
      });
    });

    // Sort by initiative (highest first)
    this.turnQueue.sort((a, b) => b.initiative - a.initiative);
  }

  /**
   * Start a new turn
   */
  private startTurn(): void {
    this.phase = 'turn_start';

    const currentEntry = this.turnQueue[this.currentTurnIndex];
    if (!currentEntry) {
      this.nextTurn();
      return;
    }

    const combatant = this.combatants.get(currentEntry.combatantId);

    if (!combatant || !combatant.isAlive) {
      this.nextTurn();
      return;
    }

    // Reset defending status at turn start
    combatant.isDefending = false;

    // Tick modifier durations
    const expired = combatant.modifiers.tickDuration();
    if (expired.length > 0) {
      this.log(`${combatant.name}'s effects wore off`);
    }
    this.recalculateStats(combatant);

    this.log(`${combatant.name}'s turn`);

    // Check battle triggers (implemented in Plan 027)
    this.checkTriggers();

    // Determine next phase based on combatant type
    if (combatant.isPlayer) {
      this.phase = 'action_select';
    } else {
      // Enemy AI selects action automatically
      this.selectEnemyAction(combatant);
    }

    this.emit();
  }

  /**
   * Player selects an action
   */
  selectAction(action: CombatAction): void {
    if (this.phase !== 'action_select') return;

    this.pendingAction = action;

    if (action.type === 'defend') {
      this.executeAction();
    } else if (action.type === 'flee') {
      this.attemptFlee();
    } else {
      // Need to select targets
      this.phase = 'target_select';
      this.emit();
    }
  }

  /**
   * Player selects target(s) for pending action
   */
  selectTargets(targetIds: string[]): void {
    if (this.phase !== 'target_select' || !this.pendingAction) return;

    this.pendingAction.targetIds = targetIds;
    this.executeAction();
  }

  /**
   * Cancel target selection and return to action select
   */
  cancelTargetSelection(): void {
    if (this.phase !== 'target_select') return;

    this.pendingAction = null;
    this.phase = 'action_select';
    this.emit();
  }

  /**
   * Execute the pending action
   */
  private executeAction(): void {
    if (!this.pendingAction) return;

    this.phase = 'action_execute';
    this.emit();

    const actor = this.combatants.get(this.pendingAction.actorId);
    if (!actor) {
      this.endTurn();
      return;
    }

    switch (this.pendingAction.type) {
      case 'skill':
        this.executeSkill(actor, this.pendingAction);
        break;
      case 'item':
        this.executeItem(actor, this.pendingAction);
        break;
      case 'defend':
        this.executeDefend(actor);
        break;
    }

    this.pendingAction = null;

    // Check if battle ended
    this.checkBattleEnd();

    // If still in execute phase, end the turn
    if (this.phase === 'action_execute') {
      this.endTurn();
    }
  }

  /**
   * Execute a skill action using ActionExecutor
   */
  private executeSkill(actor: Combatant, action: CombatAction): void {
    const skill = this.actionExecutor.getSkillById(action.skillId ?? '');

    if (!skill) {
      // Fallback to basic attack if skill not found
      this.executeBasicAttack(actor, action);
      return;
    }

    // Gather targets
    const targets = action.targetIds
      ?.map(id => this.combatants.get(id))
      .filter((t): t is Combatant => t !== undefined) ?? [];

    // Execute through ActionExecutor
    const result = this.actionExecutor.executeSkill(actor, skill, targets);

    // Log the result
    this.log(result.message);

    if (!result.success) {
      // Action failed (e.g., not enough MP)
      return;
    }

    // Log individual effects
    this.logActionEffects(result.effects);

    // Log defeated targets
    for (const targetId of result.killedTargets) {
      const target = this.combatants.get(targetId);
      if (target) {
        this.log(`${target.name} was defeated!`);
      }
    }

    // Recalculate stats for affected targets (buffs/debuffs may have changed them)
    for (const effect of result.effects) {
      if (effect.type === 'buff' || effect.type === 'debuff') {
        const target = this.combatants.get(effect.targetId);
        if (target) {
          this.recalculateStats(target);
        }
      }
    }
  }

  /**
   * Fallback basic attack when skill is not found
   */
  private executeBasicAttack(actor: Combatant, action: CombatAction): void {
    this.log(`${actor.name} attacks!`);

    if (action.targetIds) {
      for (const targetId of action.targetIds) {
        const target = this.combatants.get(targetId);
        if (target && target.isAlive) {
          const attack = actor.currentStats.Attack ?? actor.currentStats.attack ?? 10;
          const defense = target.currentStats.Defense ?? target.currentStats.defense ?? 5;
          const baseDamage = Math.max(1, Math.floor(attack * (100 / (100 + defense))));
          const actualDamage = target.isDefending ? Math.floor(baseDamage / 2) : baseDamage;

          target.currentHp = Math.max(0, target.currentHp - actualDamage);
          this.log(`${target.name} takes ${actualDamage} damage!`);

          if (target.currentHp <= 0) {
            target.isAlive = false;
            this.log(`${target.name} was defeated!`);
          }
        }
      }
    }
  }

  /**
   * Execute an item action using ActionExecutor
   */
  private executeItem(actor: Combatant, action: CombatAction): void {
    const item = this.actionExecutor.getItemById(action.itemId ?? '');

    if (!item) {
      this.log(`${actor.name} tries to use an item, but nothing happens!`);
      return;
    }

    // Gather targets
    const targets = action.targetIds
      ?.map(id => this.combatants.get(id))
      .filter((t): t is Combatant => t !== undefined) ?? [];

    // Execute through ActionExecutor
    const result = this.actionExecutor.executeItem(actor, item, targets);

    // Log the result
    this.log(result.message);

    // Log individual effects
    this.logActionEffects(result.effects);

    // Log defeated targets
    for (const targetId of result.killedTargets) {
      const target = this.combatants.get(targetId);
      if (target) {
        this.log(`${target.name} was defeated!`);
      }
    }

    // Recalculate stats for affected targets
    for (const effect of result.effects) {
      if (effect.type === 'buff' || effect.type === 'debuff') {
        const target = this.combatants.get(effect.targetId);
        if (target) {
          this.recalculateStats(target);
        }
      }
    }
  }

  /**
   * Log action effects to the battle log
   */
  private logActionEffects(effects: ActionEffect[]): void {
    for (const effect of effects) {
      const target = this.combatants.get(effect.targetId);
      if (!target) continue;

      switch (effect.type) {
        case 'damage': {
          const critText = effect.isCritical ? ' Critical hit!' : '';
          this.log(`${target.name} takes ${effect.value} damage!${critText}`);
          break;
        }
        case 'heal':
          this.log(`${target.name} recovers ${effect.value} HP!`);
          break;
        case 'healMp':
          this.log(`${target.name} recovers ${effect.value} MP!`);
          break;
        case 'buff':
          this.log(`${target.name}'s ${effect.statAffected ?? 'stats'} increased!`);
          break;
        case 'debuff':
          this.log(`${target.name}'s ${effect.statAffected ?? 'stats'} decreased!`);
          break;
        case 'revive':
          this.log(`${target.name} was revived with ${effect.value} HP!`);
          break;
      }
    }
  }

  /**
   * Execute defend action
   */
  private executeDefend(actor: Combatant): void {
    actor.isDefending = true;
    this.log(`${actor.name} is defending!`);
  }

  /**
   * Attempt to flee from battle
   */
  private attemptFlee(): void {
    // Base 50% flee chance (can be modified by stats later)
    const fleeChance = 0.5;
    const success = Math.random() < fleeChance;

    if (success) {
      this.log('Escaped successfully!');
      this.phase = 'fled';
      this.emit();
    } else {
      this.log('Failed to escape!');
      this.pendingAction = null;
      this.endTurn();
    }
  }

  /**
   * Enemy AI selects and executes an action
   */
  private selectEnemyAction(enemy: Combatant): void {
    // Get enemy definition for AI config
    const enemyDef = this.enemyDefinitions.get(enemy.id);

    // Use EnemyAI to select action based on behavior pattern
    const action = this.enemyAI.selectAction(
      enemy,
      this.getSnapshot(),
      enemyDef?.ai
    );

    this.pendingAction = action;
    this.executeAction();
  }

  /**
   * End the current turn
   */
  private endTurn(): void {
    this.phase = 'turn_end';
    this.emit();
    this.nextTurn();
  }

  /**
   * Move to the next turn in the queue
   */
  private nextTurn(): void {
    this.currentTurnIndex++;

    if (this.currentTurnIndex >= this.turnQueue.length) {
      // Start new round
      this.turnNumber++;
      this.currentTurnIndex = 0;
      this.calculateTurnOrder();
    }

    this.startTurn();
  }

  /**
   * Check if battle has ended
   */
  private checkBattleEnd(): void {
    const players = Array.from(this.combatants.values()).filter(c => c.isPlayer);
    const enemies = Array.from(this.combatants.values()).filter(c => !c.isPlayer);

    const allPlayersDead = players.every(p => !p.isAlive);
    const allEnemiesDead = enemies.every(e => !e.isAlive);

    if (allPlayersDead) {
      this.phase = 'defeat';
      this.battleResult = this.createBattleResult(false, players);
      this.log('Defeat...');
      this.emit();
    } else if (allEnemiesDead) {
      this.phase = 'victory';
      const rewards = this.calculateRewards();
      this.battleResult = this.createBattleResult(true, players, rewards);
      this.logRewards(rewards);
      this.emit();
    }
  }

  /**
   * Calculate rewards from defeated enemies
   */
  private calculateRewards(): BattleRewards {
    let totalExp = 0;
    let totalGold = 0;
    const droppedItems: DroppedItem[] = [];

    // Sum up rewards from all defeated enemies
    for (const enemyId of this.enemyDefinitions.keys()) {
      const enemyDef = this.enemyDefinitions.get(enemyId);
      if (!enemyDef) continue;

      // Add exp and gold
      totalExp += enemyDef.exp;
      totalGold += enemyDef.gold ?? 0;

      // Roll for item drops
      if (enemyDef.drops) {
        for (const drop of enemyDef.drops) {
          if (this.rollDrop(drop)) {
            // Check if item already in drops, merge if so
            const existing = droppedItems.find(d => d.itemId === drop.itemId);
            if (existing) {
              existing.count += drop.count ?? 1;
            } else {
              droppedItems.push({
                itemId: drop.itemId,
                count: drop.count ?? 1
              });
            }
          }
        }
      }
    }

    return {
      exp: totalExp,
      gold: totalGold,
      items: droppedItems
    };
  }

  /**
   * Roll for an item drop based on chance
   */
  private rollDrop(drop: ItemDrop): boolean {
    const roll = Math.random() * 100;
    return roll < drop.chance;
  }

  /**
   * Create battle result object
   */
  private createBattleResult(
    victory: boolean,
    players: Combatant[],
    rewards?: BattleRewards
  ): BattleResult {
    const survivingPlayers: SurvivorData[] = players
      .filter(p => p.isAlive)
      .map(p => ({
        id: p.id,
        name: p.name,
        remainingHp: p.currentHp,
        maxHp: p.maxHp,
        remainingMp: p.currentMp,
        maxMp: p.maxMp
      }));

    return {
      victory,
      rewards,
      survivingPlayers,
      turnCount: this.turnNumber
    };
  }

  /**
   * Log rewards to battle log
   */
  private logRewards(rewards: BattleRewards): void {
    this.log('Victory!');

    if (rewards.exp > 0) {
      this.log(`Gained ${rewards.exp} EXP!`);
    }

    if (rewards.gold > 0) {
      this.log(`Found ${rewards.gold} gold!`);
    }

    for (const item of rewards.items) {
      const itemDef = this.game.items?.find(i => i.id === item.itemId);
      const itemName = itemDef?.name ?? item.itemId;
      this.log(`Obtained ${itemName}${item.count > 1 ? ` x${item.count}` : ''}!`);
    }
  }

  /**
   * Check battle triggers and handle any that fire
   */
  private checkTriggers(): void {
    const results = this.triggerEngine.evaluate(this.getSnapshot());

    for (const result of results) {
      this.handleTriggerAction(result.action);
    }
  }

  /**
   * Handle a trigger action
   */
  private handleTriggerAction(action: BattleTriggerAction): void {
    switch (action.type) {
      case 'dialog':
        this.queueDialog(action.speaker ?? 'Narrator', action.text, action.choices);
        break;

      case 'spawn': {
        // Find enemy definition and spawn it
        const enemyDef = this.game.enemies?.find(e => e.id === action.enemyId);
        if (enemyDef) {
          this.spawnEnemy(enemyDef);
        }
        break;
      }

      case 'buff': {
        const target = action.target
          ? this.combatants.get(action.target)
          : this.getCurrentCombatant();
        if (target) {
          target.modifiers.addModifier(
            {
              id: `trigger_buff_${Date.now()}`,
              name: 'Battle Effect',
              description: 'Applied by battle trigger',
              effects: [{
                stat: action.stat,
                valueType: 'flat',
                value: action.value
              }],
              duration: action.duration ?? 3,
              stackable: false
            },
            'buff'
          );
          this.recalculateStats(target);
          this.log(`${target.name} gained a buff!`);
        }
        break;
      }

      case 'heal': {
        const target = action.target
          ? this.combatants.get(action.target)
          : this.getCurrentCombatant();
        if (target && target.isAlive) {
          const previousHp = target.currentHp;
          target.currentHp = Math.min(target.maxHp, target.currentHp + action.amount);
          const healed = target.currentHp - previousHp;
          this.log(`${target.name} recovered ${healed} HP!`);
        }
        break;
      }

      case 'damage': {
        const target = action.target
          ? this.combatants.get(action.target)
          : this.getCurrentCombatant();
        if (target && target.isAlive) {
          target.currentHp = Math.max(0, target.currentHp - action.amount);
          this.log(`${target.name} took ${action.amount} damage!`);
          if (target.currentHp <= 0) {
            target.isAlive = false;
            this.log(`${target.name} was defeated!`);
          }
        }
        break;
      }

      case 'flee': {
        const target = action.target
          ? this.combatants.get(action.target)
          : null;
        if (target && !target.isPlayer) {
          target.isAlive = false;
          this.log(`${target.name} fled the battle!`);
        }
        break;
      }

      case 'transform': {
        const target = action.target
          ? this.combatants.get(action.target)
          : this.getCurrentCombatant();
        const newEnemy = this.game.enemies?.find(e => e.id === action.newEnemyId);
        if (target && newEnemy && !target.isPlayer) {
          // Transform: update name and stats but keep HP percentage
          const hpPercent = target.currentHp / target.maxHp;
          const newStats = this.statEngine.getCompleteStats(newEnemy.baseStats, 1);

          target.name = newEnemy.name;
          target.baseStats = { ...newEnemy.baseStats };
          target.currentStats = newStats;
          target.maxHp = newStats.MaxHP ?? newStats.maxHp ?? 100;
          target.maxMp = newStats.MaxMP ?? newStats.maxMp ?? 50;
          target.currentHp = Math.floor(target.maxHp * hpPercent);
          target.skills = newEnemy.skills ?? [];

          // Update enemy definition for AI
          this.enemyDefinitions.set(target.id, newEnemy);

          this.log(`${target.name} transformed!`);
        }
        break;
      }

      case 'multi':
        // Execute multiple actions
        for (const subAction of action.actions) {
          this.handleTriggerAction(subAction);
        }
        break;
    }
  }

  /**
   * Spawn a new enemy mid-battle
   */
  private spawnEnemy(enemy: Enemy): void {
    // Find unique ID
    const baseId = enemy.id;
    let enemyId = baseId;
    let counter = 1;
    while (this.combatants.has(enemyId)) {
      enemyId = `${baseId}_${counter++}`;
    }

    const enemyCombatant = this.createCombatant(
      { ...enemy, id: enemyId },
      false
    );
    this.combatants.set(enemyCombatant.id, enemyCombatant);
    this.enemyDefinitions.set(enemyId, enemy);

    // Add to turn queue with average initiative
    const avgInitiative = this.turnQueue.reduce((sum, e) => sum + e.initiative, 0) / this.turnQueue.length;
    this.turnQueue.push({ combatantId: enemyId, initiative: avgInitiative });

    this.log(`${enemy.name} appeared!`);
  }

  /**
   * Queue a dialog to show during battle
   */
  queueDialog(speaker: string, text: string, choices?: BattleDialogChoice[]): void {
    this.dialogQueue.push({ speaker, text, choices });
    if (this.phase !== 'dialog') {
      this.showNextDialog();
    }
  }

  /**
   * Dismiss current dialog and show next (or resume battle)
   * Only works for dialogs without choices
   */
  dismissDialog(): void {
    const currentDialog = this.dialogQueue[0];

    // Don't dismiss if dialog has choices - user must select one
    if (currentDialog?.choices && currentDialog.choices.length > 0) {
      return;
    }

    this.dialogQueue.shift();
    if (this.dialogQueue.length > 0) {
      this.showNextDialog();
    } else {
      // Resume previous phase
      this.phase = this.previousPhase;
      this.emit();
    }
  }

  /**
   * Select a choice in the current dialog
   * Executes the choice's action and advances the dialog
   */
  selectDialogChoice(choiceId: string): void {
    const currentDialog = this.dialogQueue[0];
    if (!currentDialog?.choices) return;

    const choice = currentDialog.choices.find(c => c.id === choiceId);
    if (!choice) return;

    // Remove current dialog
    this.dialogQueue.shift();

    // Execute choice action if any
    if (choice.action) {
      this.handleTriggerAction(choice.action);
    }

    // Continue with next dialog or resume battle
    if (this.dialogQueue.length > 0) {
      this.showNextDialog();
    } else {
      this.phase = this.previousPhase;
      this.emit();
    }
  }

  /**
   * Show the next dialog in queue
   */
  private showNextDialog(): void {
    this.previousPhase = this.phase;
    this.phase = 'dialog';
    this.emit();
  }

  /**
   * Create a Combatant from a Character or Enemy
   */
  private createCombatant(
    source: Character | (Enemy & { id: string }),
    isPlayer: boolean
  ): Combatant {
    const modifiers = new ModifierStack();
    const level = isPlayer ? (source as Character).level ?? 1 : 1;

    // Calculate derived stats from base stats
    const computedStats = this.statEngine.getCompleteStats(source.baseStats, level);

    return {
      id: source.id,
      name: source.name,
      isPlayer,
      baseStats: { ...source.baseStats },
      currentStats: computedStats,
      currentHp: computedStats.MaxHP ?? computedStats.maxHp ?? 100,
      currentMp: computedStats.MaxMP ?? computedStats.maxMp ?? 50,
      maxHp: computedStats.MaxHP ?? computedStats.maxHp ?? 100,
      maxMp: computedStats.MaxMP ?? computedStats.maxMp ?? 50,
      skills: source.skills ?? [],
      modifiers,
      isDefending: false,
      isAlive: true,
      level
    };
  }

  /**
   * Recalculate a combatant's current stats after modifier changes
   */
  private recalculateStats(combatant: Combatant): void {
    const baseComputed = this.statEngine.getCompleteStats(combatant.baseStats, combatant.level);
    combatant.currentStats = combatant.modifiers.applyToStats(baseComputed);
    combatant.maxHp = combatant.currentStats.MaxHP ?? combatant.currentStats.maxHp ?? combatant.maxHp;
    combatant.maxMp = combatant.currentStats.MaxMP ?? combatant.currentStats.maxMp ?? combatant.maxMp;
  }

  /**
   * Add a message to the battle log
   */
  private log(message: string): void {
    this.battleLog.push(message);
  }

  // ============================================
  // Subscription API for React
  // ============================================

  /**
   * Subscribe to state changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit state change to all listeners
   */
  private emit(): void {
    this.listeners.forEach(l => l());
  }

  /**
   * Get immutable snapshot of current state
   */
  getSnapshot(): CombatSnapshot {
    return {
      phase: this.phase,
      turnNumber: this.turnNumber,
      currentTurnIndex: this.currentTurnIndex,
      turnQueue: [...this.turnQueue],
      combatants: new Map(this.combatants),
      pendingAction: this.pendingAction ? { ...this.pendingAction } : null,
      battleLog: [...this.battleLog],
      dialogQueue: [...this.dialogQueue],
      currentDialog: this.dialogQueue[0] ?? null,
      battleResult: this.battleResult
    };
  }

  // ============================================
  // Convenience getters
  // ============================================

  /**
   * Get the current combatant whose turn it is
   */
  getCurrentCombatant(): Combatant | null {
    const entry = this.turnQueue[this.currentTurnIndex];
    return entry ? this.combatants.get(entry.combatantId) ?? null : null;
  }

  /**
   * Get all living enemies
   */
  getEnemies(): Combatant[] {
    return Array.from(this.combatants.values()).filter(c => !c.isPlayer && c.isAlive);
  }

  /**
   * Get all living players
   */
  getPlayers(): Combatant[] {
    return Array.from(this.combatants.values()).filter(c => c.isPlayer && c.isAlive);
  }

  /**
   * Get all combatants (alive or dead)
   */
  getAllCombatants(): Combatant[] {
    return Array.from(this.combatants.values());
  }

  /**
   * Get the scene associated with this battle
   */
  getScene(): Scene {
    return this.scene;
  }

  /**
   * Check if battle is over
   */
  isBattleOver(): boolean {
    return this.phase === 'victory' || this.phase === 'defeat' || this.phase === 'fled';
  }
}
