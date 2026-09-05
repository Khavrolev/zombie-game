import { describe, expect, it } from 'vitest'
import { canFire } from './cooldown'

describe('canFire', () => {
  it('allows firing when never fired before', () => {
    expect(canFire(null, 1000, 10000)).toBe(true)
  })

  it('blocks firing before the cooldown elapses', () => {
    expect(canFire(1000, 5000, 10000)).toBe(false)
  })

  it('allows firing exactly at the cooldown boundary', () => {
    expect(canFire(1000, 11000, 10000)).toBe(true)
  })

  it('allows firing after the cooldown elapses', () => {
    expect(canFire(1000, 20000, 10000)).toBe(true)
  })
})
