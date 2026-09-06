import { ORIENTATION_CHANGE_REFRESH_DELAYS_MS, REFLOW_OVERLAY_ELEMENT_ID } from '../game/constants'

/**
 * Covers the screen for as long as the post-rotation layout recalculation
 * burst (see sync-ui-bounds.ts) is running, so the player sees a plain
 * screen instead of briefly-misplaced UI while things settle.
 */
export function maskReflowOnOrientationChange(): void {
  const overlay = document.getElementById(REFLOW_OVERLAY_ELEMENT_ID)
  if (!overlay) return

  const lastDelay = ORIENTATION_CHANGE_REFRESH_DELAYS_MS[ORIENTATION_CHANGE_REFRESH_DELAYS_MS.length - 1]

  const handleOrientationChange = (): void => {
    overlay.hidden = false
    window.setTimeout(() => {
      overlay.hidden = true
    }, lastDelay)
  }

  window.addEventListener('orientationchange', handleOrientationChange)
  screen.orientation?.addEventListener('change', handleOrientationChange)
}
