import { createSkill } from './factory'

export function createMagicSkill(name: string) {
  return createSkill({
    name: name,
    staminaCost: 0,
    damageType: 'Magic',
    damage: 1,
  })
}
