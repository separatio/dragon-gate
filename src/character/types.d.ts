type Alignment = 'Good' | 'Neutral' | 'Evil'

type Race =
  | 'Changeling'
  | 'Demon'
  | 'Ghost'
  | 'Elf'
  | 'Fae'
  | 'Nephilim'
  | 'Goblin'
  | 'Human'
  | 'Ogre'

type Character = {
  name: string
  race: Race
  alignment: Alignment
  stats: Stats
  skills: Skill[]
  standardSkills: Skill[]
}
