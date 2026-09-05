import type { Point } from '../types'

export interface Targetable extends Point {
  id: string
}

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function nearestTargets<T extends Targetable>(
  origin: Point,
  candidates: T[],
  count: number
): T[] {
  return [...candidates]
    .sort((a, b) => distance(origin, a) - distance(origin, b))
    .slice(0, count)
}
