export function canFire(lastFiredAt: number | null, now: number, cooldownMs: number): boolean {
  if (lastFiredAt === null) return true
  return now - lastFiredAt >= cooldownMs
}
