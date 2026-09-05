import { describe, expect, it } from 'vitest'
import { applyHit, isDestroyed } from './durability'

describe('applyHit', () => {
  it('reduces hp by one', () => {
    expect(applyHit(5, 5)).toBe(4)
  })

  it('never goes below zero', () => {
    expect(applyHit(0, 5)).toBe(0)
  })

  it('works the same regardless of maxHp, since it only clamps the floor', () => {
    expect(applyHit(2, 2)).toBe(1)
  })
})

describe('isDestroyed', () => {
  it('is destroyed at zero hp', () => {
    expect(isDestroyed(0)).toBe(true)
  })

  it('is not destroyed above zero hp', () => {
    expect(isDestroyed(1)).toBe(false)
  })
})
