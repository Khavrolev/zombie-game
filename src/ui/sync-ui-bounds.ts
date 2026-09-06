import Phaser from 'phaser'
import { ORIENTATION_CHANGE_REFRESH_DELAY_MS } from '../game/constants'

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

  // Mobile browsers can report stale viewport dimensions for a moment right
  // after a physical orientation change (the address bar/toolbar is still
  // animating). Force a re-measure shortly after so Phaser's FIT scale — and
  // this synced overlay — settle on the real post-rotation viewport.
  window.addEventListener('orientationchange', () => {
    window.setTimeout(() => game.scale.refresh(), ORIENTATION_CHANGE_REFRESH_DELAY_MS)
  })
}
