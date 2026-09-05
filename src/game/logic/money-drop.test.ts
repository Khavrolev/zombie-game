import { describe, expect, it } from 'vitest'
import { isBlinking, isExpired } from './money-drop'

describe('isExpired', () => {
  it('is not expired right after dropping', () => {
    expect(isExpired(0, 0)).toBe(false)
  })

  it('is not expired just before the 5s TTL', () => {
    expect(isExpired(0, 4999)).toBe(false)
  })

  it('is expired at the 5s TTL boundary', () => {
    expect(isExpired(0, 5000)).toBe(true)
  })
})

describe('isBlinking', () => {
  it('is not blinking right after dropping', () => {
    expect(isBlinking(0, 0)).toBe(false)
  })

  it('is not blinking just before the last 2s window', () => {
    expect(isBlinking(0, 2999)).toBe(false)
  })

  it('is blinking at the start of the last 2s window', () => {
    expect(isBlinking(0, 3000)).toBe(true)
  })

  it('is no longer blinking once expired', () => {
    expect(isBlinking(0, 5000)).toBe(false)
  })
})
