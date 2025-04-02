function generatePermanentStats(): PermanentStats {
  return {
    power: 1,
    charisma: 1,
  }
}

function generateBattleStats(): BattleStats {
  return {
    stamina: 100,
  }
}

export function generateDefaultStats(): Stats {
  return {
    permanentStats: generatePermanentStats(),
    battleStats: generateBattleStats(),
  }
}
