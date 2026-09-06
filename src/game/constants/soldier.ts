import type { RelativePoint } from '../types'
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './field'

export const SOLDIER_COOLDOWN_MS = 5000
export const SOLDIER_COST = 50
export const SOLDIER_MAX_HP = 2
export const SOLDIER_SIZE = 24
export const SOLDIER_COLOR = 0x557799
export const SOLDIER_BURST_COUNT = 1

// Positions as fractions of DESIGN_WIDTH/DESIGN_HEIGHT (see field.ts) — the
// slots stay clustered the same way relative to the cannon on any screen.
export const SOLDIER_SLOTS: RelativePoint[] = [
  { xFraction: 80 / DESIGN_WIDTH, yFraction: 150 / DESIGN_HEIGHT },
  { xFraction: 80 / DESIGN_WIDTH, yFraction: 390 / DESIGN_HEIGHT },
  { xFraction: 140 / DESIGN_WIDTH, yFraction: 210 / DESIGN_HEIGHT },
  { xFraction: 140 / DESIGN_WIDTH, yFraction: 330 / DESIGN_HEIGHT },
]
