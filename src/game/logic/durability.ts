import { clamp } from '../../utils/clamp'

export function applyHit(hp: number, maxHp: number): number {
  return clamp(hp - 1, 0, maxHp)
}

export function isDestroyed(hp: number): boolean {
  return hp <= 0
}
