import Phaser from 'phaser'
import { TAP_TARGET_PADDING_PX } from '../constants'

/**
 * Makes a Rectangle-shaped game object interactive with a tap/click hit area
 * padded by TAP_TARGET_PADDING_PX on every side — the visible square stays
 * small, but taps just outside it (easy to miss on a phone) still register.
 */
export function setPaddedInteractive(gameObject: Phaser.GameObjects.Rectangle, width: number, height: number): void {
  gameObject.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(
      -TAP_TARGET_PADDING_PX,
      -TAP_TARGET_PADDING_PX,
      width + TAP_TARGET_PADDING_PX * 2,
      height + TAP_TARGET_PADDING_PX * 2
    ),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    cursor: 'pointer',
  })
}
