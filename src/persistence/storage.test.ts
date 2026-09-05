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
})

describe('saveProgress / loadProgress round trip', () => {
  it('returns exactly what was saved', () => {
    saveProgress({ money: 120, levelCompleted: true })
    expect(loadProgress()).toEqual({ money: 120, levelCompleted: true })
  })
})
