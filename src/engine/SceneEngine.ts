/**
 * Scene Engine
 * Core engine that manages scene state, transitions, and story/battle mode switching
 */

import type { Scene, Choice, GameDefinition } from '../types';
import { StoryVariables } from '../stores/storyVariables';

export type SceneState =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'story'; scene: Scene; contentIndex: number }
  | { type: 'choices'; scene: Scene; choices: Choice[] }
  | { type: 'battle'; scene: Scene }
  | { type: 'transition'; from: string; to: string };

export interface SceneEngineConfig {
  game: GameDefinition;
  onStateChange: (state: SceneState) => void;
  onBattleStart?: (scene: Scene) => void;
  onBattleEnd?: (victory: boolean, nextScene: string) => void;
}

export class SceneEngine {
  private game: GameDefinition;
  private state: SceneState = { type: 'idle' };
  private currentSceneId: string | null = null;
  private onStateChange: (state: SceneState) => void;
  private onBattleStart?: (scene: Scene) => void;
  private onBattleEnd?: (victory: boolean, nextScene: string) => void;

  constructor(config: SceneEngineConfig) {
    this.game = config.game;
    this.onStateChange = config.onStateChange;
    this.onBattleStart = config.onBattleStart;
    this.onBattleEnd = config.onBattleEnd;
  }

  start(): void {
    this.goToScene(this.game.startingScene);
  }

  goToScene(sceneId: string): void {
    const scene = this.game.scenes.find((s) => s.id === sceneId);

    if (!scene) {
      console.error(`Scene not found: ${sceneId}`);
      return;
    }

    const previousSceneId = this.currentSceneId;
    this.currentSceneId = sceneId;

    // Transition animation state (skip for first scene)
    if (previousSceneId) {
      this.setState({ type: 'transition', from: previousSceneId, to: sceneId });
    }

    // Handle scene by type
    if (scene.type === 'story') {
      this.startStoryScene(scene);
    } else if (scene.type === 'battle') {
      this.startBattleScene(scene);
    }
  }

  private startStoryScene(scene: Scene): void {
    // If no content, go straight to choices
    if (!scene.content || scene.content.length === 0) {
      this.showChoices(scene);
      return;
    }

    this.setState({
      type: 'story',
      scene,
      contentIndex: 0,
    });
  }

  private startBattleScene(scene: Scene): void {
    this.setState({ type: 'battle', scene });
    this.onBattleStart?.(scene);
  }

  advanceContent(): void {
    if (this.state.type !== 'story') return;

    const { scene, contentIndex } = this.state;
    const content = scene.content || [];

    if (contentIndex < content.length - 1) {
      // More content to show
      this.setState({
        type: 'story',
        scene,
        contentIndex: contentIndex + 1,
      });
    } else {
      // Content finished, show choices
      this.showChoices(scene);
    }
  }

  private showChoices(scene: Scene): void {
    const choices = scene.choices || [];
    const availableChoices = choices.filter((choice) => this.evaluateChoiceCondition(choice));

    this.setState({
      type: 'choices',
      scene,
      choices: availableChoices,
    });
  }

  selectChoice(choiceId: string): void {
    if (this.state.type !== 'choices') return;

    const choice = this.state.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    // Apply choice effects
    if (choice.effects) {
      this.applyEffects(choice.effects);
    }

    // Set choice flag for tracking
    StoryVariables.set(`choice_${this.currentSceneId}_${choiceId}`, true);

    // Go to next scene
    if (choice.nextScene) {
      this.goToScene(choice.nextScene);
    }
  }

  handleBattleEnd(victory: boolean): void {
    if (this.state.type !== 'battle') return;

    const scene = this.state.scene;
    const nextScene = victory ? scene.victoryScene : scene.defeatScene;

    if (nextScene) {
      this.onBattleEnd?.(victory, nextScene);
      this.goToScene(nextScene);
    }
  }

  private evaluateChoiceCondition(choice: Choice): boolean {
    if (!choice.condition) return true;

    // Simple condition evaluation
    // Format: "variable operator value" e.g., "hasKey == true"
    const parts = choice.condition.split(/\s+/);
    if (parts.length !== 3) return true;

    const [varName, operator, value] = parts;
    const varValue = StoryVariables.get(varName);

    switch (operator) {
      case '==':
        return String(varValue) === value;
      case '!=':
        return String(varValue) !== value;
      case '>':
        return Number(varValue) > Number(value);
      case '<':
        return Number(varValue) < Number(value);
      case '>=':
        return Number(varValue) >= Number(value);
      case '<=':
        return Number(varValue) <= Number(value);
      default:
        return true;
    }
  }

  private applyEffects(effects: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(effects)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        StoryVariables.set(key, value);
      }
    }
  }

  private setState(state: SceneState): void {
    this.state = state;
    this.onStateChange(state);
  }

  getState(): SceneState {
    return this.state;
  }

  getCurrentScene(): Scene | null {
    return this.currentSceneId
      ? this.game.scenes.find((s) => s.id === this.currentSceneId) || null
      : null;
  }

  getCurrentSceneId(): string | null {
    return this.currentSceneId;
  }
}
