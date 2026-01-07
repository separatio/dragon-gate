/**
 * Combat engine barrel exports
 */

export {
  CombatStateMachine,
  type CombatPhase,
  type Combatant,
  type CombatAction,
  type CombatActionType,
  type TurnQueueEntry,
  type DialogEntry,
  type CombatSnapshot
} from './CombatState';

export {
  DamageCalculator,
  type DamageResult,
  type DamageContext
} from './DamageCalculator';

export {
  ActionExecutor,
  type ActionResult,
  type ActionEffect
} from './ActionExecutor';
