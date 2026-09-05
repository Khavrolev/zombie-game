import { describe, expect, it } from 'vitest'
import { getLevelOutcome } from './level-outcome'

describe('getLevelOutcome', () => {
  it('is in-progress while zombies remain and the chest is untouched', () => {
    expect(getLevelOutcome({ zombiesRemaining: 3, chestReached: false })).toBe('in-progress')
  })

  it('is won when no zombies remain and the chest was never reached', () => {
    expect(getLevelOutcome({ zombiesRemaining: 0, chestReached: false })).toBe('won')
  })

  it('is lost when the chest was reached', () => {
    expect(getLevelOutcome({ zombiesRemaining: 2, chestReached: true })).toBe('lost')
  })

  it('treats chest reached as lost even if zombies also hit zero', () => {
    expect(getLevelOutcome({ zombiesRemaining: 0, chestReached: true })).toBe('lost')
  })
})
