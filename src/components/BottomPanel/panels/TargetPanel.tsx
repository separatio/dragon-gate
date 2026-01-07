/**
 * TargetPanel Component
 * Target selection for choosing enemies or allies
 */

import { TargetOption } from '../BottomPanelContext';

interface TargetPanelProps {
  targets: TargetOption[];
  onSelect: (targetId: string) => void;
  onBack: () => void;
}

export default function TargetPanel({ targets, onSelect, onBack }: TargetPanelProps) {
  const enemies = targets.filter((t) => t.type === 'enemy');
  const allies = targets.filter((t) => t.type === 'ally');

  return (
    <div className="target-panel">
      <button className="target-back" onClick={onBack} aria-label="Go back">
        ← Back
      </button>

      <div className="target-groups">
        {enemies.length > 0 && (
          <div className="target-group">
            <h3 className="target-group-title">Enemies</h3>
            <div className="target-list">
              {enemies.map((target) => (
                <button
                  key={target.id}
                  className="target-button enemy"
                  onClick={() => onSelect(target.id)}
                >
                  <span className="target-name">{target.name}</span>
                  {target.maxHP && (
                    <div className="target-hp">
                      <div
                        className="target-hp-bar"
                        style={{ width: `${(target.currentHP! / target.maxHP) * 100}%` }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {allies.length > 0 && (
          <div className="target-group">
            <h3 className="target-group-title">Allies</h3>
            <div className="target-list">
              {allies.map((target) => (
                <button
                  key={target.id}
                  className="target-button ally"
                  onClick={() => onSelect(target.id)}
                >
                  <span className="target-name">{target.name}</span>
                  {target.maxHP && (
                    <div className="target-hp">
                      <div
                        className="target-hp-bar ally-bar"
                        style={{ width: `${(target.currentHP! / target.maxHP) * 100}%` }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
