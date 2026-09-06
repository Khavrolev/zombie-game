import type { Point } from '../types'

export function moveToward(
  current: Point,
  target: Point,
  speedPxPerSec: number,
  deltaSeconds: number
): Point {
  const dx = target.x - current.x
  const dy = target.y - current.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const step = speedPxPerSec * deltaSeconds

  if (dist <= step) {
    return { x: target.x, y: target.y }
  }

  return {
    x: current.x + (dx / dist) * step,
    y: current.y + (dy / dist) * step,
  }
}
