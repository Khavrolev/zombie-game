export type LevelOutcome = 'in-progress' | 'won' | 'lost'

export interface LevelOutcomeInput {
  zombiesRemaining: number
  chestReached: boolean
}

export function getLevelOutcome({ zombiesRemaining, chestReached }: LevelOutcomeInput): LevelOutcome {
  if (chestReached) return 'lost'
  if (zombiesRemaining <= 0) return 'won'
  return 'in-progress'
}
