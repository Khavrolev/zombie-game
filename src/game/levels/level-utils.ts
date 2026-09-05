import type { LevelConfig } from './types'

export function getTotalZombieCount(level: LevelConfig): number {
  return level.waves.reduce((sum, wave) => sum + wave.count, 0)
}
