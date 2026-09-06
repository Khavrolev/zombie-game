import { describe, expect, it } from 'vitest'
import { clamp } from './clamp'

describe('clamp', () => {
  it('returns the value when inside the range', () => {
    expect(clamp(3, 0, 5)).toBe(3)
  })

  it('returns min when value is below range', () => {
    expect(clamp(-1, 0, 5)).toBe(0)
  })

  it('returns max when value is above range', () => {
    expect(clamp(9, 0, 5)).toBe(5)
  })
})
