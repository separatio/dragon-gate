/**
 * Accessibility Menu Component
 * UI panel for adjusting accessibility settings
 */

import { useAccessibility } from '../theme/useAccessibility';
import type { FontScale } from '../theme/AccessibilityContext';

/** Font scale options with labels */
const FONT_SCALE_OPTIONS: { value: FontScale; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium (Default)' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Extra Large' },
];

/**
 * AccessibilityMenu component
 * Displays toggles and options for all accessibility features
 */
export function AccessibilityMenu() {
  const { settings, updateSetting, resetToDefaults } = useAccessibility();

  return (
    <div className="p-4 bg-surface rounded-lg">
      <h2 className="text-xl font-ui font-bold mb-4">Accessibility Settings</h2>

      {/* Font Size */}
      <div className="mb-4">
        <label className="block text-sm font-ui font-medium mb-2">Text Size</label>
        <select
          value={settings.fontScale}
          onChange={(e) => updateSetting('fontScale', e.target.value as FontScale)}
          className="w-full p-2 rounded bg-surface-elevated border-2 border-transparent focus:border-current"
          style={{ borderColor: 'var(--color-accent)' }}
        >
          {FONT_SCALE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* High Contrast */}
      <div className="mb-4 flex items-center justify-between">
        <label className="text-sm font-ui font-medium">High Contrast Mode</label>
        <input
          type="checkbox"
          checked={settings.highContrast}
          onChange={(e) => updateSetting('highContrast', e.target.checked)}
          className="w-5 h-5 accent-current"
          style={{ accentColor: 'var(--color-accent)' }}
        />
      </div>

      {/* Reduce Motion */}
      <div className="mb-4 flex items-center justify-between">
        <label className="text-sm font-ui font-medium">Reduce Animations</label>
        <input
          type="checkbox"
          checked={settings.reduceMotion}
          onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
          className="w-5 h-5 accent-current"
          style={{ accentColor: 'var(--color-accent)' }}
        />
      </div>

      {/* Dyslexia Font */}
      <div className="mb-4 flex items-center justify-between">
        <label className="text-sm font-ui font-medium">Dyslexia-Friendly Font</label>
        <input
          type="checkbox"
          checked={settings.dyslexiaFont}
          onChange={(e) => updateSetting('dyslexiaFont', e.target.checked)}
          className="w-5 h-5 accent-current"
          style={{ accentColor: 'var(--color-accent)' }}
        />
      </div>

      {/* Reset Button */}
      <button onClick={resetToDefaults} className="w-full mt-4 btn btn-secondary">
        Reset to Defaults
      </button>
    </div>
  );
}
