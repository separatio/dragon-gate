type PermanentStats = {
  power: number
  charisma: number
}

type BattleStats = {
  // Consumed when using any skill
  stamina: number
}

type Stats = {
  permanentStats: PermanentStats
  battleStats: BattleStats
}
