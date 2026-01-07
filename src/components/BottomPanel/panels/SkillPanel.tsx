/**
 * SkillPanel Component
 * Skill selection using CategoryGrid with MP/HP cost display
 */

import { CategoryGrid } from '../../CategoryGrid';
import { SkillOption } from '../BottomPanelContext';

interface SkillPanelProps {
  skills: SkillOption[];
  categories: string[];
  onSelect: (skillId: string) => void;
  onBack: () => void;
}

export default function SkillPanel({ skills, categories, onSelect, onBack }: SkillPanelProps) {
  return (
    <CategoryGrid
      items={skills}
      categories={categories}
      onSelect={onSelect}
      onBack={onBack}
      renderItem={(skill) => (
        <>
          <span className="skill-name">{skill.name}</span>
          <span className={`skill-cost ${skill.costType.toLowerCase()}`}>
            {skill.cost} {skill.costType}
          </span>
        </>
      )}
    />
  );
}
