import { describe, expect, it } from 'vitest'
import { moveToward } from './movement'

describe('moveToward', () => {
  it('steps toward the target along a straight horizontal line', () => {
    const result = moveToward({ x: 0, y: 0 }, { x: 100, y: 0 }, 10, 1)
    expect(result).toEqual({ x: 10, y: 0 })
  })

  it('does not overshoot the target when the step is larger than the distance', () => {
    const result = moveToward({ x: 0, y: 0 }, { x: 5, y: 0 }, 100, 1)
    expect(result).toEqual({ x: 5, y: 0 })
  })

  it('returns the same point when already at the target', () => {
    const result = moveToward({ x: 5, y: 5 }, { x: 5, y: 5 }, 50, 1)
    expect(result).toEqual({ x: 5, y: 5 })
  })

  it('moves diagonally toward the target', () => {
    const result = moveToward({ x: 0, y: 0 }, { x: 3, y: 4 }, 5, 1)
    expect(result.x).toBeCloseTo(3)
    expect(result.y).toBeCloseTo(4)
  })
})
