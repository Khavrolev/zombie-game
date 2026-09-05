import { describe, expect, it } from 'vitest'
import { distance, nearestTargets } from './targeting'

describe('distance', () => {
  it('computes euclidean distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })
})

describe('nearestTargets', () => {
  const origin = { x: 0, y: 0 }
  const far = { id: 'far', x: 100, y: 0 }
  const near = { id: 'near', x: 1, y: 0 }
  const mid = { id: 'mid', x: 10, y: 0 }

  it('returns candidates sorted by ascending distance', () => {
    expect(nearestTargets(origin, [far, near, mid], 3)).toEqual([near, mid, far])
  })

  it('caps the result at count', () => {
    expect(nearestTargets(origin, [far, near, mid], 2)).toEqual([near, mid])
  })

  it('returns fewer than count when not enough candidates exist', () => {
    expect(nearestTargets(origin, [near], 4)).toEqual([near])
  })

  it('returns an empty array for no candidates', () => {
    expect(nearestTargets(origin, [], 4)).toEqual([])
  })
})
