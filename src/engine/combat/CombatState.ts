/**
 * Combat State Machine
 * Manages battle flow: turn order, phases, action selection, and resolution
 */

import type { Character, Enemy } from '../../types/character';
import type { Scene } from '../../types/scene';
import type { StatBlock } from '../../types/stats';
import { StatEngine } from '../stats/StatEngine';
import { ModifierStack } from '../stats/ModifierStack';

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
  private previousPhase: CombatPhase = 'start';

  private statEngine: StatEngine;
  private scene: Scene;
  private listeners: Set<() => void> = new Set();

  constructor(statEngine: StatEngine, scene: Scene) {
    this.statEngine = statEngine;
    this.scene = scene;
  }

  /**
   * Initialize battle with player and enemies
   */
  initialize(player: Character, enemies: Enemy[]): void {
    this.combatants.clear();
    this.battleLog = [];
    this.dialogQueue = [];
    this.pendingAction = null;

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
   * Execute a skill action (placeholder - full implementation in Plan 024)
   */
  private executeSkill(actor: Combatant, action: CombatAction): void {
    // Placeholder: log the skill use
    // Full damage calculation in Plan 024/025
    this.log(`${actor.name} uses ${action.skillId ?? 'attack'}!`);

    // Apply basic damage to targets (simplified for now)
    if (action.targetIds) {
      for (const targetId of action.targetIds) {
        const target = this.combatants.get(targetId);
        if (target && target.isAlive) {
          // Basic attack damage (proper formula in Plan 025)
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
   * Execute an item action (placeholder - full implementation in Plan 024)
   */
  private executeItem(actor: Combatant, action: CombatAction): void {
    this.log(`${actor.name} uses ${action.itemId ?? 'item'}!`);
    // Full implementation in Plan 024
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
    // Simple AI: pick a random skill and target a random player
    const skillId = enemy.skills.length > 0
      ? enemy.skills[Math.floor(Math.random() * enemy.skills.length)]
      : 'basic_attack';

    const playerTargets = Array.from(this.combatants.values())
      .filter(c => c.isPlayer && c.isAlive);

    if (playerTargets.length === 0) {
      this.endTurn();
      return;
    }

    // Target random player (enhanced AI in Plan 026)
    const target = playerTargets[Math.floor(Math.random() * playerTargets.length)];

    this.pendingAction = {
      type: 'skill',
      actorId: enemy.id,
      skillId,
      targetIds: [target.id]
    };

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
      this.log('Defeat...');
      this.emit();
    } else if (allEnemiesDead) {
      this.phase = 'victory';
      this.log('Victory!');
      this.emit();
    }
  }

  /**
   * Check battle triggers (placeholder - implementation in Plan 027)
   */
  private checkTriggers(): void {
    // Full implementation in Plan 027
  }

  /**
   * Queue a dialog to show during battle
   */
  queueDialog(speaker: string, text: string): void {
    this.dialogQueue.push({ speaker, text });
    if (this.phase !== 'dialog') {
      this.showNextDialog();
    }
  }

  /**
   * Dismiss current dialog and show next (or resume battle)
   */
  dismissDialog(): void {
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
      currentDialog: this.dialogQueue[0] ?? null
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
