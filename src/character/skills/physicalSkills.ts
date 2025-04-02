import { createSkill } from './factory'

export function createPhysicalSkill(name: string) {
  return createSkill({
    name: name,
    staminaCost: 0,
    damageType: 'Physical',
    damage: 1,
  })
}
