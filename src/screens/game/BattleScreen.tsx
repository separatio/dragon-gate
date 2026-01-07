/**
 * Battle Screen
 * Integrates combat engine with UI components for turn-based battles
 */

import { useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { BottomPanelContext } from '../../components/BottomPanel/BottomPanelContext';
import type {
  ActionOption,
  SkillOption,
  ItemOption,
  TargetOption,
  ChoiceOption,
} from '../../components/BottomPanel/BottomPanelContext';
import { useCombat } from '../../hooks/useCombat';
import { StatEngine } from '../../engine/stats/StatEngine';
import type { GameDefinition } from '../../types/game';
import type { Scene } from '../../types/scene';
import type { Character, Enemy } from '../../types/character';
import type { CombatSnapshot, Combatant } from '../../engine/combat/CombatState';

interface BattleScreenProps {
  /** Current battle scene */
  scene: Scene;
  /** Game definition for lookups */
  game: GameDefinition;
  /** Player character */
  player: Character;
  /** Callback when battle ends */
  onBattleEnd: (victory: boolean) => void;
}

/**
 * BattleScreen component
 * Manages battle flow and connects combat engine to UI panels
 */
export default function BattleScreen({
  scene,
  game,
  player,
  onBattleEnd,
}: BattleScreenProps) {
  const panelContext = useContext(BottomPanelContext);
  const battleStarted = useRef(false);

  // Create stat engine from game config
  const statEngine = useMemo(
    () => StatEngine.fromStatsConfig(game.stats),
    [game.stats]
  );

  // Initialize combat hook
  const {
    snapshot,
    startBattle,
    selectAction,
    selectTargets,
    cancelTargetSelection,
    dismissDialog,
    selectDialogChoice,
    endBattle,
    isInBattle,
  } = useCombat(statEngine, game);

  // Resolve enemy definitions from scene
  const enemies = useMemo((): Enemy[] => {
    if (!scene.enemies) return [];
    return scene.enemies
      .map((enemyId) => game.enemies.find((e) => e.id === enemyId))
      .filter((e): e is Enemy => e !== undefined);
  }, [scene.enemies, game.enemies]);

  // Start battle on mount
  useEffect(() => {
    if (!battleStarted.current && enemies.length > 0) {
      battleStarted.current = true;
      startBattle(scene, player, enemies);
    }
  }, [scene, player, enemies, startBattle]);

  // Handle battle end
  useEffect(() => {
    if (!snapshot) return;

    if (snapshot.phase === 'victory' || snapshot.phase === 'defeat') {
      // Small delay to show results before transitioning
      const timer = setTimeout(() => {
        const victory = snapshot.phase === 'victory';
        endBattle();
        onBattleEnd(victory);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [snapshot?.phase, endBattle, onBattleEnd, snapshot]);

  // Get current player combatant
  const getPlayerCombatant = useCallback((): Combatant | null => {
    if (!snapshot) return null;
    return Array.from(snapshot.combatants.values()).find((c) => c.isPlayer) ?? null;
  }, [snapshot]);

  // Build action options for action panel
  const buildActionOptions = useCallback((): ActionOption[] => {
    const playerCombatant = getPlayerCombatant();
    if (!playerCombatant) return [];

    return [
      {
        id: 'attack',
        label: 'Attack',
        variant: 'primary',
        onSelect: () =>
          selectAction({
            type: 'skill',
            actorId: playerCombatant.id,
            skillId: 'basic_attack',
          }),
      },
      {
        id: 'skills',
        label: 'Skills',
        variant: 'secondary',
        disabled: playerCombatant.skills.length === 0,
        onSelect: () => showSkillPanel(),
      },
      {
        id: 'items',
        label: 'Items',
        variant: 'secondary',
        onSelect: () => showItemPanel(),
      },
      {
        id: 'defend',
        label: 'Defend',
        variant: 'secondary',
        onSelect: () =>
          selectAction({
            type: 'defend',
            actorId: playerCombatant.id,
          }),
      },
      {
        id: 'flee',
        label: 'Flee',
        variant: 'danger',
        onSelect: () =>
          selectAction({
            type: 'flee',
            actorId: playerCombatant.id,
          }),
      },
    ];
  }, [getPlayerCombatant, selectAction]);

  // Show skill selection panel
  const showSkillPanel = useCallback(() => {
    if (!panelContext) return;
    const playerCombatant = getPlayerCombatant();
    if (!playerCombatant) return;

    const skills: SkillOption[] = playerCombatant.skills
      .map((skillId) => game.skills.find((s) => s.id === skillId))
      .filter((skill): skill is NonNullable<typeof skill> => skill !== undefined)
      .map((skill) => ({
        id: skill.id,
        name: skill.name,
        category: skill.category ?? 'General',
        cost: skill.mpCost ?? 0,
        costType: 'MP' as const,
        disabled: (skill.mpCost ?? 0) > playerCombatant.currentMp,
        description: skill.description,
      }));

    const categories = [...new Set(skills.map((s) => s.category))];

    panelContext.showSkills(
      skills,
      categories,
      (skillId: string) => {
        selectAction({
          type: 'skill',
          actorId: playerCombatant.id,
          skillId,
        });
      },
      () => showActionPanel()
    );
  }, [panelContext, getPlayerCombatant, game.skills, selectAction]);

  // Show item selection panel
  const showItemPanel = useCallback(() => {
    if (!panelContext) return;
    const playerCombatant = getPlayerCombatant();
    if (!playerCombatant) return;

    // Get player inventory - filter to consumable items
    const items: ItemOption[] = [];
    for (const invItem of player.inventory ?? []) {
      const itemDef = game.items.find((i) => i.id === invItem.id);
      // Only show consumable items that can be used in battle
      if (itemDef && itemDef.type === 'consumable') {
        items.push({
          id: itemDef.id,
          name: itemDef.name,
          category: itemDef.category ?? 'General',
          quantity: invItem.count,
          disabled: invItem.count <= 0,
          description: itemDef.description,
        });
      }
    }

    const categories = [...new Set(items.map((i) => i.category))];

    panelContext.showItems(
      items,
      categories.length > 0 ? categories : ['General'],
      (itemId: string) => {
        selectAction({
          type: 'item',
          actorId: playerCombatant.id,
          itemId,
        });
      },
      () => showActionPanel()
    );
  }, [panelContext, getPlayerCombatant, player.inventory, game.items, selectAction]);

  // Show target selection panel
  const showTargetPanel = useCallback(
    (snapshot: CombatSnapshot) => {
      if (!panelContext) return;

      const targets: TargetOption[] = Array.from(snapshot.combatants.values())
        .filter((c) => c.isAlive)
        .map((c) => ({
          id: c.id,
          name: c.name,
          type: c.isPlayer ? ('ally' as const) : ('enemy' as const),
          currentHP: c.currentHp,
          maxHP: c.maxHp,
        }));

      panelContext.showTargets(
        targets,
        (targetId: string) => selectTargets([targetId]),
        () => {
          cancelTargetSelection();
          showActionPanel();
        }
      );
    },
    [panelContext, selectTargets, cancelTargetSelection]
  );

  // Show action panel
  const showActionPanel = useCallback(() => {
    if (!panelContext) return;
    panelContext.showActions(buildActionOptions());
  }, [panelContext, buildActionOptions]);

  // Show dialog panel
  const showDialogPanel = useCallback(
    (snapshot: CombatSnapshot) => {
      if (!panelContext || !snapshot.currentDialog) return;

      const dialog = snapshot.currentDialog;

      if (dialog.choices && dialog.choices.length > 0) {
        // Dialog with choices
        const choices: ChoiceOption[] = dialog.choices.map((choice) => ({
          id: choice.id,
          text: choice.text,
          disabled: false,
          onSelect: () => selectDialogChoice(choice.id),
        }));

        // Show speaker text then choices
        panelContext.showText(dialog.text, dialog.speaker, () => {
          panelContext.showChoices(choices);
        });
      } else {
        // Simple dialog - click to dismiss
        panelContext.showText(dialog.text, dialog.speaker, dismissDialog);
      }
    },
    [panelContext, selectDialogChoice, dismissDialog]
  );

  // Show battle results
  const showResultsPanel = useCallback(
    (snapshot: CombatSnapshot) => {
      if (!panelContext || !snapshot.battleResult) return;

      const result = snapshot.battleResult;
      let message = result.victory ? 'Victory!' : 'Defeat...';

      if (result.victory && result.rewards) {
        const rewards = result.rewards;
        if (rewards.exp > 0) {
          message += `\nGained ${rewards.exp} EXP!`;
        }
        if (rewards.gold > 0) {
          message += `\nFound ${rewards.gold} gold!`;
        }
        for (const item of rewards.items) {
          const itemDef = game.items.find((i) => i.id === item.itemId);
          const itemName = itemDef?.name ?? item.itemId;
          message += `\nObtained ${itemName}${item.count > 1 ? ` x${item.count}` : ''}!`;
        }
      }

      panelContext.showText(message, undefined);
    },
    [panelContext, game.items]
  );

  // Sync combat state to bottom panel
  useEffect(() => {
    if (!panelContext || !snapshot) return;

    switch (snapshot.phase) {
      case 'action_select':
        showActionPanel();
        break;
      case 'target_select':
        showTargetPanel(snapshot);
        break;
      case 'dialog':
        showDialogPanel(snapshot);
        break;
      case 'victory':
      case 'defeat':
        showResultsPanel(snapshot);
        break;
      case 'turn_start':
      case 'action_execute':
      case 'turn_end':
        // Show battle log during execution phases
        if (snapshot.battleLog.length > 0) {
          const lastLog = snapshot.battleLog[snapshot.battleLog.length - 1];
          panelContext.showText(lastLog, undefined);
        }
        break;
      default:
        break;
    }
  }, [
    snapshot,
    panelContext,
    showActionPanel,
    showTargetPanel,
    showDialogPanel,
    showResultsPanel,
  ]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!snapshot) return;

      // Number keys for action selection
      if (snapshot.phase === 'action_select') {
        const keyMap: Record<string, number> = {
          '1': 0,
          '2': 1,
          '3': 2,
          '4': 3,
          '5': 4,
        };
        const index = keyMap[e.key];
        if (index !== undefined) {
          const actions = buildActionOptions();
          if (index < actions.length && !actions[index].disabled) {
            e.preventDefault();
            actions[index].onSelect();
          }
        }
      }

      // Enter/Space to advance dialog
      if (snapshot.phase === 'dialog') {
        if (e.key === 'Enter' || e.key === ' ') {
          if (!snapshot.currentDialog?.choices?.length) {
            e.preventDefault();
            dismissDialog();
          }
        }
      }

      // Escape to cancel target selection
      if (snapshot.phase === 'target_select') {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelTargetSelection();
          showActionPanel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    snapshot,
    buildActionOptions,
    dismissDialog,
    cancelTargetSelection,
    showActionPanel,
  ]);

  // Loading state
  if (!isInBattle || !snapshot) {
    return (
      <div className="battle-loading">
        <div className="battle-loading__spinner" />
        <p>Preparing battle...</p>
      </div>
    );
  }

  // Render battle HUD overlay (enemy/player status)
  return (
    <div className="battle-screen">
      {/* Enemy status bars */}
      <div className="battle-enemies">
        {Array.from(snapshot.combatants.values())
          .filter((c) => !c.isPlayer && c.isAlive)
          .map((enemy) => (
            <div key={enemy.id} className="battle-enemy">
              <span className="battle-enemy__name">{enemy.name}</span>
              <div className="battle-enemy__hp-bar">
                <div
                  className="battle-enemy__hp-fill"
                  style={{ width: `${(enemy.currentHp / enemy.maxHp) * 100}%` }}
                />
              </div>
            </div>
          ))}
      </div>

      {/* Player status */}
      <div className="battle-player">
        {Array.from(snapshot.combatants.values())
          .filter((c) => c.isPlayer)
          .map((p) => (
            <div key={p.id} className="battle-player__status">
              <span className="battle-player__name">{p.name}</span>
              <div className="battle-player__bars">
                <div className="battle-player__hp">
                  <span>HP</span>
                  <div className="battle-player__bar">
                    <div
                      className="battle-player__bar-fill hp"
                      style={{ width: `${(p.currentHp / p.maxHp) * 100}%` }}
                    />
                  </div>
                  <span>
                    {p.currentHp}/{p.maxHp}
                  </span>
                </div>
                <div className="battle-player__mp">
                  <span>MP</span>
                  <div className="battle-player__bar">
                    <div
                      className="battle-player__bar-fill mp"
                      style={{ width: `${(p.currentMp / p.maxMp) * 100}%` }}
                    />
                  </div>
                  <span>
                    {p.currentMp}/{p.maxMp}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Turn indicator */}
      <div className="battle-turn">Turn {snapshot.turnNumber}</div>
    </div>
  );
}
