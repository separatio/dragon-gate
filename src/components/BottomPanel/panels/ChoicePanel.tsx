/**
 * ChoicePanel Component
 * Story choice buttons display
 */

import { ChoiceButton } from '../../ui';
import { ChoiceOption } from '../BottomPanelContext';

interface ChoicePanelProps {
  choices: ChoiceOption[];
}

export default function ChoicePanel({ choices }: ChoicePanelProps) {
  return (
    <div className="choice-panel">
      <div className="choice-list">
        {choices.map((choice) => (
          <ChoiceButton
            key={choice.id}
            onClick={choice.onSelect}
            disabled={choice.disabled}
            fullWidth
          >
            {choice.text}
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
