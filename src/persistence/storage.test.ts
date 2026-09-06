import { beforeEach, describe, expect, it } from 'vitest'
import { loadProgress, saveProgress } from './storage'

beforeEach(() => {
  localStorage.clear()
})

describe('loadProgress', () => {
  it('returns null when nothing was saved', () => {
    expect(loadProgress()).toBeNull()
  })

  it('returns null when the stored value is corrupted JSON', () => {
    localStorage.setItem('zombie-game:progress', 'not json')
    expect(loadProgress()).toBeNull()
  })

  it('returns null when the stored value is valid JSON but the wrong shape', () => {
    localStorage.setItem('zombie-game:progress', '123')
    expect(loadProgress()).toBeNull()
  })

  it('returns null when the stored value has a non-numeric money field', () => {
    localStorage.setItem('zombie-game:progress', '{"money":"not-a-number","levelCompleted":true}')
    expect(loadProgress()).toBeNull()
  })
})

describe('saveProgress / loadProgress round trip', () => {
  it('returns exactly what was saved', () => {
    saveProgress({ money: 120, levelCompleted: true })
    expect(loadProgress()).toEqual({ money: 120, levelCompleted: true })
  })
})
