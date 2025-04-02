import { createStandardSkills } from './skills/factory'
import { generateDefaultStats } from './stats/factory'

const alignmentRaceMap: Record<Alignment, Race[]> = {
  Evil: ['Changeling', 'Demon', 'Ghost'],
  Good: ['Elf', 'Fae', 'Nephilim'],
  Neutral: ['Goblin', 'Human', 'Ogre'],
}

function getAlignmentForRace(race: Race): Alignment {
  for (const [alignment, races] of Object.entries(alignmentRaceMap)) {
    if (races.includes(race)) {
      return alignment as Alignment
    }
  }
  throw new Error(`Race does not exist: ${race}`)
}

export function createCharacter(name: string, race: Race): Character {
  const alignment = getAlignmentForRace(race)
  const standardSkills = createStandardSkills()
  const stats: Stats = generateDefaultStats()

  return {
    name,
    race,
    alignment,
    stats: { ...stats },
    skills: [],
    standardSkills: [...standardSkills],
  }
}
