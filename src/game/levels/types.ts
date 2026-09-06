import type { RelativePoint } from '../types'

export interface ZombieType {
  id: string
  hp: number
  speedPxPerSec: number
  color: number
  size: number
}

export interface WaveConfig {
  zombieType: ZombieType
  count: number
  spawnIntervalMs: number
}

export interface LevelConfig {
  id: number
  backgroundColor: number
  cannonPosition: RelativePoint
  chestPosition: RelativePoint
  soldierSlots: RelativePoint[]
  waves: WaveConfig[]
}
