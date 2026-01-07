/**
 * Story Variables Store
 * Reactive store for story flags, counters, and state that persists throughout gameplay
 */

import { useSyncExternalStore } from 'react';

export type VariableValue = string | number | boolean | null;

interface StoryVariablesStore {
  variables: Map<string, VariableValue>;
  listeners: Set<() => void>;
}

function createStoryVariablesStore(): StoryVariablesStore {
  return {
    variables: new Map(),
    listeners: new Set(),
  };
}

let store = createStoryVariablesStore();

function emitChange(): void {
  store.listeners.forEach((listener) => listener());
}

export const StoryVariables = {
  get(key: string): VariableValue {
    return store.variables.get(key) ?? null;
  },

  set(key: string, value: VariableValue): void {
    store.variables.set(key, value);
    emitChange();
  },

  increment(key: string, amount: number = 1): void {
    const current = store.variables.get(key);
    const newValue = (typeof current === 'number' ? current : 0) + amount;
    store.variables.set(key, newValue);
    emitChange();
  },

  decrement(key: string, amount: number = 1): void {
    StoryVariables.increment(key, -amount);
  },

  toggle(key: string): void {
    const current = store.variables.get(key);
    store.variables.set(key, !current);
    emitChange();
  },

  has(key: string): boolean {
    return store.variables.has(key);
  },

  delete(key: string): void {
    store.variables.delete(key);
    emitChange();
  },

  clear(): void {
    store.variables.clear();
    emitChange();
  },

  getAll(): Record<string, VariableValue> {
    const result: Record<string, VariableValue> = {};
    store.variables.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  },

  loadFromSave(data: Record<string, VariableValue>): void {
    store.variables.clear();
    for (const [key, value] of Object.entries(data)) {
      store.variables.set(key, value);
    }
    emitChange();
  },

  subscribe(listener: () => void): () => void {
    store.listeners.add(listener);
    return () => store.listeners.delete(listener);
  },

  getSnapshot(): Map<string, VariableValue> {
    return store.variables;
  },

  reset(): void {
    store = createStoryVariablesStore();
  },
};

/**
 * Hook to access the StoryVariables API
 */
export function useStoryVariables() {
  return StoryVariables;
}

/**
 * Hook to watch a specific variable (re-renders on change)
 */
export function useStoryVariable(key: string): VariableValue {
  const value = useSyncExternalStore(
    StoryVariables.subscribe,
    () => StoryVariables.get(key),
    () => StoryVariables.get(key)
  );
  return value;
}

/**
 * Hook to watch all variables (re-renders on any change)
 */
export function useAllStoryVariables(): Record<string, VariableValue> {
  const variables = useSyncExternalStore(
    StoryVariables.subscribe,
    () => StoryVariables.getAll(),
    () => StoryVariables.getAll()
  );
  return variables;
}
