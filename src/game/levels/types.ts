import type { Point } from '../types'

export interface ZombieType {
  id: string
  hp: number
  speedPxPerSec: number
  color: number
}

export interface WaveConfig {
  zombieType: ZombieType
  count: number
  spawnIntervalMs: number
}

export interface LevelConfig {
  id: number
  backgroundColor: number
  cannonPosition: Point
  chestPosition: Point
  soldierSlots: Point[]
  waves: WaveConfig[]
}
