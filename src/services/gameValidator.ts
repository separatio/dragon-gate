/**
 * Game Validator
 * Validates game definition JSON against required structure
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Type guard for Record<string, unknown> */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateGameDefinition(json: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(json)) {
    return { valid: false, errors: ['Game definition must be an object'] };
  }

  const game = json; // Type narrowed by isRecord guard

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
  if (!isRecord(game.theme)) {
    errors.push('Missing or invalid "theme" object');
  } else {
    validateTheme(game.theme, errors);
  }

  // Stats validation
  if (!isRecord(game.stats)) {
    errors.push('Missing or invalid "stats" object');
  } else {
    validateStats(game.stats, errors);
  }

  // Characters validation
  if (!isRecord(game.characters)) {
    errors.push('Missing or invalid "characters" object');
  } else {
    if (!isRecord(game.characters.player)) {
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

  if (!isRecord(theme.colors)) {
    errors.push('Theme missing "colors" object');
    return;
  }

  const colors = theme.colors;
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
  if (!isRecord(scene)) {
    errors.push(`Scene ${index} is not an object`);
    return;
  }

  if (!scene.id || typeof scene.id !== 'string') {
    errors.push(`Scene ${index} missing "id"`);
  }

  if (typeof scene.type !== 'string' || !['story', 'battle'].includes(scene.type)) {
    errors.push(`Scene ${index} has invalid "type" (must be "story" or "battle")`);
  }
}
