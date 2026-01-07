# Dragon Gate Game Definition

This directory contains the default demo game for Dragon Gate.

## File Structure

```
games/
  your-game/
    game.json       # Main game definition
    README.md       # Optional documentation
```

## game.json Structure

### Required Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the game |
| `title` | string | Display name |
| `version` | string | Semantic version (e.g., "1.0.0") |
| `theme` | object | Visual theming configuration |
| `stats` | object | Primary and derived stat definitions |
| `characters` | object | Player and NPC definitions |
| `enemies` | array | Enemy definitions |
| `skills` | array | Combat skill definitions |
| `items` | array | Consumable and equipment definitions |
| `scenes` | array | Story and battle scene definitions |
| `startingScene` | string | ID of the first scene to load |

### Theme Object

```json
{
  "colors": {
    "primary": "#1a1a2e",
    "secondary": "#16213e",
    "accent": "#e94560",
    "background": "#0f0f23",
    "text": "#eaeaea"
  },
  "textbox": {
    "background": "#1a1a2eee",
    "text": "#eaeaea",
    "border": "#e94560"
  },
  "typography": {
    "fontFamily": "Georgia, serif",
    "fontFamilyUI": "system-ui, sans-serif",
    "baseFontSize": "18px",
    "lineHeight": "1.6"
  }
}
```

### Stats Object

Primary stats are the base attributes that characters have. Derived stats are calculated from primary stats using formulas.

```json
{
  "primary": [
    { "id": "str", "name": "Strength", "abbrev": "STR", "description": "...", "defaultValue": 10, "minValue": 1, "maxValue": 99 }
  ],
  "derived": [
    { "id": "maxHp", "name": "Max HP", "formula": "con * 10 + 50" }
  ],
  "combatFormulas": {
    "physicalDamage": "(attackerPhysAtk - defenderPhysDef * 0.5) * (1 + variance * 0.1)"
  }
}
```

### Scene Types

**Story Scene:**
```json
{
  "id": "intro",
  "type": "story",
  "content": [
    { "type": "text", "value": "Narrative text here..." }
  ],
  "choices": [
    { "id": "choice1", "text": "Option text", "nextScene": "next_scene_id" }
  ]
}
```

**Battle Scene:**
```json
{
  "id": "battle_goblin",
  "type": "battle",
  "enemies": ["goblin"],
  "background": "forest",
  "victoryScene": "victory_scene_id",
  "defeatScene": "defeat_scene_id",
  "triggers": []
}
```

### Battle Triggers

Triggers allow mid-battle events like dialog:

```json
{
  "condition": "enemy.hp < enemy.maxHp * 0.3",
  "once": true,
  "action": {
    "type": "dialog",
    "speaker": "Enemy Name",
    "text": "Dialog text here..."
  }
}
```

## Creating Your Own Game

1. Copy this `default` folder to a new folder (e.g., `my-game`)
2. Edit `game.json` with your content
3. Load your game by pointing to `games/my-game/game.json`
