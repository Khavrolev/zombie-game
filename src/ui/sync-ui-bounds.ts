import Phaser from 'phaser'
import { ORIENTATION_CHANGE_REFRESH_DELAYS_MS } from '../game/constants'

export function syncUiRootToCanvas(game: Phaser.Game, uiRoot: HTMLElement): void {
  const apply = (): void => {
    const bounds = game.scale.canvasBounds
    uiRoot.style.left = `${bounds.x}px`
    uiRoot.style.top = `${bounds.y}px`
    uiRoot.style.width = `${bounds.width}px`
    uiRoot.style.height = `${bounds.height}px`
  }

  apply()
  game.scale.on(Phaser.Scale.Events.RESIZE, apply)

  // Mobile browsers can report stale viewport dimensions for a while after a
  // physical orientation change (the address bar/toolbar animates in/out).
  // A single early refresh can lock in a still-wrong size, so try several
  // times at increasing delays until the viewport has actually settled —
  // each refresh re-measures and re-emits RESIZE, which `apply` above (and
  // the scene's own layout listener) picks up.
  const scheduleRefreshBurst = (): void => {
    for (const delay of ORIENTATION_CHANGE_REFRESH_DELAYS_MS) {
      window.setTimeout(() => game.scale.refresh(), delay)
    }
  }

  window.addEventListener('orientationchange', scheduleRefreshBurst)
  screen.orientation?.addEventListener('change', scheduleRefreshBurst)
}
