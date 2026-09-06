import Phaser from 'phaser'
import { FIELD_HEIGHT, FIELD_WIDTH, GAME_ROOT_ELEMENT_ID, LETTERBOX_COLOR } from './constants'

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: GAME_ROOT_ELEMENT_ID,
  backgroundColor: LETTERBOX_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: FIELD_WIDTH,
    height: FIELD_HEIGHT,
  },
}
