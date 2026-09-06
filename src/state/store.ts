import { atom } from 'nanostores'
import { CANNON_MAX_HP } from '../game/constants'

export const $money = atom<number>(0)
export const $levelCompleted = atom<boolean>(false)
export const $cannonHp = atom<number>(CANNON_MAX_HP)

export function addMoney(amount: number): void {
  $money.set($money.get() + amount)
}

export function spendMoney(amount: number): boolean {
  const current = $money.get()
  if (current < amount) return false
  $money.set(current - amount)
  return true
}

export function resetCannon(): void {
  $cannonHp.set(CANNON_MAX_HP)
}

export function resetProgress(): void {
  $money.set(0)
  $levelCompleted.set(false)
}
