import { describe, expect, it } from 'vitest'
import { getTotalZombieCount } from './level-utils'
import type { LevelConfig } from './types'
import { BASIC_ZOMBIE } from './zombie-types'

const baseLevel: Omit<LevelConfig, 'waves'> = {
  id: 1,
  backgroundColor: 0x000000,
  cannonPosition: { x: 0, y: 0 },
  chestPosition: { x: 0, y: 0 },
  soldierSlots: [],
}

describe('getTotalZombieCount', () => {
  it('returns 0 for a level with no waves', () => {
    expect(getTotalZombieCount({ ...baseLevel, waves: [] })).toBe(0)
  })

  it('sums zombie counts across multiple waves', () => {
    const level: LevelConfig = {
      ...baseLevel,
      waves: [
        { zombieType: BASIC_ZOMBIE, count: 5, spawnIntervalMs: 1000 },
        { zombieType: BASIC_ZOMBIE, count: 8, spawnIntervalMs: 1000 },
      ],
    }
    expect(getTotalZombieCount(level)).toBe(13)
  })
})
