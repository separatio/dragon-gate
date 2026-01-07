/**
 * useChoiceEvaluator Hook
 * React hook for evaluating choice availability
 */

import { useMemo, useCallback } from 'react';
import type { Choice, GameDefinition, Character } from '../types';
import { ChoiceEvaluator, EvaluatedChoice } from '../engine/ChoiceEvaluator';

interface UseChoiceEvaluatorReturn {
  evaluate: (choices: Choice[], character: Character) => EvaluatedChoice[];
}

export function useChoiceEvaluator(game: GameDefinition | null): UseChoiceEvaluatorReturn {
  const evaluator = useMemo(() => {
    return game ? new ChoiceEvaluator(game) : null;
  }, [game]);

  const evaluate = useCallback(
    (choices: Choice[], character: Character): EvaluatedChoice[] => {
      if (!evaluator) {
        return choices.map((c) => ({ ...c, available: true }));
      }
      return evaluator.evaluateChoices(choices, character);
    },
    [evaluator]
  );

  return { evaluate };
}
