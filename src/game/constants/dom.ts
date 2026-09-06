export const GAME_ROOT_ELEMENT_ID = 'game-root'
export const UI_ROOT_ELEMENT_ID = 'ui-root'
export const REFLOW_OVERLAY_ELEMENT_ID = 'reflow-overlay'
export const CANVAS_BACKGROUND_COLOR = '#000000'
// Multiple staggered attempts: Android's toolbar-hide/show animation during
// a rotation can take several hundred ms to settle, and a single early
// refresh can lock in a still-stale viewport size.
export const ORIENTATION_CHANGE_REFRESH_DELAYS_MS = [100, 300, 600, 1000]
