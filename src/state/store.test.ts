import { beforeEach, describe, expect, it } from 'vitest'
import { $cannonHp, $levelCompleted, $money, addMoney, resetCannon, spendMoney } from './store'

beforeEach(() => {
  $money.set(0)
  resetCannon()
})

describe('addMoney', () => {
  it('increases the money balance', () => {
    addMoney(50)
    expect($money.get()).toBe(50)
  })
})

describe('spendMoney', () => {
  it('deducts money and returns true when funds are sufficient', () => {
    addMoney(100)
    expect(spendMoney(30)).toBe(true)
    expect($money.get()).toBe(70)
  })

  it('leaves money unchanged and returns false when funds are insufficient', () => {
    addMoney(10)
    expect(spendMoney(30)).toBe(false)
    expect($money.get()).toBe(10)
  })
})

describe('resetCannon', () => {
  it('resets cannon hp to the max value', () => {
    $cannonHp.set(1)
    resetCannon()
    expect($cannonHp.get()).toBe(5)
  })
})
