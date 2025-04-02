type Skill = {
  name: string
  staminaCost: number
  damageType?: DamageType
  damage: number
}

type DamageType = 'Physical' | 'Magic'
