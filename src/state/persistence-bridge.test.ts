import { beforeEach, describe, expect, it } from 'vitest'
import { loadProgress, saveProgress } from '../persistence/storage'
import { $levelCompleted, $money } from './store'
import { initPersistence } from './persistence-bridge'

beforeEach(() => {
  localStorage.clear()
  $money.off()
  $levelCompleted.off()
  $money.set(0)
  $levelCompleted.set(false)
})

describe('initPersistence', () => {
  it('loads saved progress into the atoms on startup', () => {
    saveProgress({ money: 75, levelCompleted: true })
    initPersistence()
    expect($money.get()).toBe(75)
    expect($levelCompleted.get()).toBe(true)
  })

  it('persists atom changes back to storage', () => {
    initPersistence()
    $money.set(42)
    expect(loadProgress()).toEqual({ money: 42, levelCompleted: false })
  })
})
