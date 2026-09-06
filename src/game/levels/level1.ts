import { CANNON_POSITION, CHEST_POSITION, SOLDIER_SLOTS } from '../constants'
import type { LevelConfig } from './types'
import { BASIC_ZOMBIE } from './zombie-types'

export const level1: LevelConfig = {
  id: 1,
  backgroundColor: 0x2f4f2f,
  cannonPosition: CANNON_POSITION,
  chestPosition: CHEST_POSITION,
  soldierSlots: SOLDIER_SLOTS,
  waves: [{ zombieType: BASIC_ZOMBIE, count: 20, spawnIntervalMs: 2000 }],
}
