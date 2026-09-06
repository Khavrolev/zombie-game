import type { RelativePoint } from '../types'

// Reference resolution used ONLY to derive the fractions below in a readable
// way — the actual field is dynamic (Scale.RESIZE, fills the real screen),
// computed at runtime from `this.scale.width`/`this.scale.height`.
export const DESIGN_WIDTH = 960
export const DESIGN_HEIGHT = 540

export const CANNON_POSITION: RelativePoint = {
  xFraction: 80 / DESIGN_WIDTH,
  yFraction: 270 / DESIGN_HEIGHT,
}
export const CHEST_POSITION: RelativePoint = {
  xFraction: 20 / DESIGN_WIDTH,
  yFraction: 270 / DESIGN_HEIGHT,
}

export const CONTACT_RADIUS_PX = 24
export const SPAWN_MARGIN_PX = 40
export const ZOMBIE_SPAWN_EDGE_MARGIN_PX = 20
