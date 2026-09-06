import { MONEY_DROP_BLINK_MS, MONEY_DROP_TTL_MS } from '../constants'

export function isExpired(droppedAt: number, now: number): boolean {
  return now - droppedAt >= MONEY_DROP_TTL_MS
}

export function isBlinking(droppedAt: number, now: number): boolean {
  const age = now - droppedAt
  return age >= MONEY_DROP_TTL_MS - MONEY_DROP_BLINK_MS && age < MONEY_DROP_TTL_MS
}
