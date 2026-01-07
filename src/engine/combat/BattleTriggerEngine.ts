/**
 * Battle Trigger Engine
 * Evaluates and fires mid-battle event triggers based on combat conditions
 */

import type { BattleTrigger, BattleTriggerAction } from '../../types/scene';
import type { GameDefinition } from '../../types/game';
import type { FormulaContext } from '../formula/types';
import type { Combatant, CombatSnapshot } from './CombatState';
import { FormulaParser } from '../formula/FormulaParser';

/**
 * Result of trigger evaluation
 */
export interface TriggerResult {
  /** The trigger that fired */
  trigger: BattleTrigger;
  /** Action(s) to execute */
  action: BattleTriggerAction;
}

/**
 * Context for trigger condition evaluation
 * Extends FormulaContext to support nested objects for dot notation (e.g., enemy.hpPercent)
 */
export interface TriggerContext extends FormulaContext {
  /** Current turn number */
  turn: number;
  /** Number of living players */
  playersAlive: number;
  /** Number of living enemies */
  enemiesAlive: number;
  /** Total players */
  totalPlayers: number;
  /** Total enemies */
  totalEnemies: number;
}

/**
 * Battle Trigger Engine
 *
 * Evaluates trigger conditions during combat and returns actions to execute.
 * Tracks fired triggers to support `once` and `maxFires` behavior.
 *
 * @example
 * ```ts
 * const engine = new BattleTriggerEngine(game);
 * engine.setTriggers(scene.triggers ?? []);
 *
 * // During combat, check for triggered events
 * const results = engine.evaluate(snapshot);
 * for (const result of results) {
 *   // Handle result.action
 * }
 * ```
 */
export class BattleTriggerEngine {
  private game: GameDefinition;
  private parser: FormulaParser;
  private triggers: BattleTrigger[] = [];
  private firedCounts: Map<string, number> = new Map();
  private triggerIdCounter = 0;

  constructor(game: GameDefinition) {
    this.game = game;
    this.parser = new FormulaParser();
  }

  /**
   * Set the triggers for the current battle
   * Resets all fired counts
   */
  setTriggers(triggers: BattleTrigger[]): void {
    // Assign IDs to triggers that don't have them
    this.triggers = triggers.map(t => ({
      ...t,
      id: t.id ?? `trigger_${this.triggerIdCounter++}`
    }));
    this.firedCounts.clear();
  }

  /**
   * Clear all triggers and reset state
   */
  clear(): void {
    this.triggers = [];
    this.firedCounts.clear();
  }

  /**
   * Evaluate all triggers against current combat state
   * Returns array of actions to execute
   */
  evaluate(snapshot: CombatSnapshot): TriggerResult[] {
    const results: TriggerResult[] = [];
    const context = this.buildContext(snapshot);

    for (const trigger of this.triggers) {
      // Skip if already fired max times
      if (!this.canFire(trigger)) continue;

      // Evaluate condition
      try {
        const conditionResult = this.parser.compute(trigger.condition, context);
        if (conditionResult) {
          // Condition is truthy, fire the trigger
          this.recordFire(trigger);
          results.push({ trigger, action: trigger.action });
        }
      } catch (err) {
        // Log error but don't crash combat
        console.warn(`Trigger condition error: ${trigger.condition}`, err);
      }
    }

    return results;
  }

  /**
   * Check if a trigger can still fire based on once/maxFires settings
   */
  private canFire(trigger: BattleTrigger): boolean {
    const id = trigger.id!;
    const firedCount = this.firedCounts.get(id) ?? 0;

    // Check 'once' flag
    if (trigger.once && firedCount >= 1) {
      return false;
    }

    // Check 'maxFires' limit
    if (trigger.maxFires !== undefined && firedCount >= trigger.maxFires) {
      return false;
    }

    return true;
  }

  /**
   * Record that a trigger has fired
   */
  private recordFire(trigger: BattleTrigger): void {
    const id = trigger.id!;
    const current = this.firedCounts.get(id) ?? 0;
    this.firedCounts.set(id, current + 1);
  }

  /**
   * Build the context object for formula evaluation
   * Provides access to combatant data via dot notation
   */
  private buildContext(snapshot: CombatSnapshot): TriggerContext {
    const combatants = Array.from(snapshot.combatants.values());
    const players = combatants.filter(c => c.isPlayer);
    const enemies = combatants.filter(c => !c.isPlayer);

    const context: TriggerContext = {
      turn: snapshot.turnNumber,
      playersAlive: players.filter(c => c.isAlive).length,
      enemiesAlive: enemies.filter(c => c.isAlive).length,
      totalPlayers: players.length,
      totalEnemies: enemies.length
    };

    // Add each combatant's data to the context
    // Accessible via: combatantId.property (e.g., "goblin_1.hpPercent")
    for (const combatant of combatants) {
      context[combatant.id] = this.buildCombatantContext(combatant);
    }

    // Add convenience aliases for single-combatant battles
    // "player" and "enemy" point to first of each type
    if (players.length > 0) {
      context['player'] = this.buildCombatantContext(players[0]);
    }
    if (enemies.length > 0) {
      context['enemy'] = this.buildCombatantContext(enemies[0]);
    }

    return context;
  }

  /**
   * Build context for a single combatant
   */
  private buildCombatantContext(combatant: Combatant): FormulaContext {
    return {
      hp: combatant.currentHp,
      maxHp: combatant.maxHp,
      hpPercent: (combatant.currentHp / combatant.maxHp) * 100,
      mp: combatant.currentMp,
      maxMp: combatant.maxMp,
      mpPercent: combatant.maxMp > 0
        ? (combatant.currentMp / combatant.maxMp) * 100
        : 100,
      level: combatant.level,
      isAlive: combatant.isAlive ? 1 : 0,
      isDefending: combatant.isDefending ? 1 : 0,
      // Include all stats
      ...combatant.currentStats
    };
  }

  /**
   * Get the game definition (for action execution)
   */
  getGame(): GameDefinition {
    return this.game;
  }
}
