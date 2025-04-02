export function createSkill({
  name,
  staminaCost,
  damageType,
  damage,
}: Skill): Skill {
  return { name, staminaCost, damageType, damage }
}

export function createStandardSkills(): Skill[] {
  return [
    { name: 'Attack', staminaCost: 0, damageType: 'Physical', damage: 10 },
    { name: 'Defend', staminaCost: 0, damage: 0 },
  ]
}
