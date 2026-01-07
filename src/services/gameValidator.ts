/**
 * Game Validator
 * Validates game definition JSON against required structure
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGameDefinition(json: unknown): ValidationResult {
  const errors: string[] = [];

  if (!json || typeof json !== 'object') {
    return { valid: false, errors: ['Game definition must be an object'] };
  }

  const game = json as Record<string, unknown>;

  // Required top-level fields
  if (!game.id || typeof game.id !== 'string') {
    errors.push('Missing or invalid "id" field');
  }

  if (!game.title || typeof game.title !== 'string') {
    errors.push('Missing or invalid "title" field');
  }

  if (!game.version || typeof game.version !== 'string') {
    errors.push('Missing or invalid "version" field');
  }

  // Theme validation
  if (!game.theme || typeof game.theme !== 'object') {
    errors.push('Missing or invalid "theme" object');
  } else {
    validateTheme(game.theme as Record<string, unknown>, errors);
  }

  // Stats validation
  if (!game.stats || typeof game.stats !== 'object') {
    errors.push('Missing or invalid "stats" object');
  } else {
    validateStats(game.stats as Record<string, unknown>, errors);
  }

  // Characters validation
  if (!game.characters || typeof game.characters !== 'object') {
    errors.push('Missing or invalid "characters" object');
  } else {
    const chars = game.characters as Record<string, unknown>;
    if (!chars.player || typeof chars.player !== 'object') {
      errors.push('Missing player character in "characters"');
    }
  }

  // Enemies validation (can be empty array)
  if (!Array.isArray(game.enemies)) {
    errors.push('Missing "enemies" array');
  }

  // Skills validation (can be empty array)
  if (!Array.isArray(game.skills)) {
    errors.push('Missing "skills" array');
  }

  // Items validation (can be empty array)
  if (!Array.isArray(game.items)) {
    errors.push('Missing "items" array');
  }

  // Scenes validation
  if (!Array.isArray(game.scenes) || game.scenes.length === 0) {
    errors.push('Missing or empty "scenes" array');
  } else {
    game.scenes.forEach((scene, index) => {
      validateScene(scene, index, errors);
    });
  }

  // Starting scene validation
  if (!game.startingScene || typeof game.startingScene !== 'string') {
    errors.push('Missing or invalid "startingScene" field');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateTheme(theme: Record<string, unknown>, errors: string[]): void {
  const requiredColors = ['primary', 'secondary', 'accent', 'background', 'text'];

  if (!theme.colors || typeof theme.colors !== 'object') {
    errors.push('Theme missing "colors" object');
    return;
  }

  const colors = theme.colors as Record<string, unknown>;
  requiredColors.forEach((color) => {
    if (!colors[color] || typeof colors[color] !== 'string') {
      errors.push(`Theme missing required color: ${color}`);
    }
  });
}

function validateStats(stats: Record<string, unknown>, errors: string[]): void {
  if (!Array.isArray(stats.primary)) {
    errors.push('Stats missing "primary" array');
  }

  if (!Array.isArray(stats.derived)) {
    errors.push('Stats missing "derived" array');
  }
}

function validateScene(scene: unknown, index: number, errors: string[]): void {
  if (!scene || typeof scene !== 'object') {
    errors.push(`Scene ${index} is not an object`);
    return;
  }

  const s = scene as Record<string, unknown>;

  if (!s.id || typeof s.id !== 'string') {
    errors.push(`Scene ${index} missing "id"`);
  }

  if (!s.type || !['story', 'battle'].includes(s.type as string)) {
    errors.push(`Scene ${index} has invalid "type" (must be "story" or "battle")`);
  }
}
