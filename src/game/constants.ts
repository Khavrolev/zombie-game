import type { Point } from './types'

export const FIELD_WIDTH = 960
export const FIELD_HEIGHT = 540

export const CANNON_POSITION: Point = { x: 80, y: 270 }
export const CHEST_POSITION: Point = { x: 20, y: 270 }
export const CONTACT_RADIUS_PX = 24

export const CANNON_MAX_HP = 5
export const CANNON_COOLDOWN_MS = 10000
export const CANNON_BURST_COUNT = 4

export const SOLDIER_COOLDOWN_MS = 5000
export const SOLDIER_COST = 50
export const SOLDIER_MAX_HP = 2
export const SOLDIER_SLOTS: Point[] = [
  { x: 80, y: 150 },
  { x: 80, y: 390 },
  { x: 140, y: 210 },
  { x: 140, y: 330 },
]

export const RAKE_COST = 30

export const ZOMBIE_SPAWN_X = FIELD_WIDTH - 20
export const ZOMBIE_ATTACK_INTERVAL_MS = 5000

export const MONEY_SKY_INTERVAL_MS = 30000
export const MONEY_SKY_AMOUNT = 50
export const MONEY_ZOMBIE_DROP_AMOUNT = 10
export const MONEY_DROP_TTL_MS = 5000
export const MONEY_DROP_BLINK_MS = 2000
