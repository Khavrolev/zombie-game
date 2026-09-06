import Phaser from 'phaser'
import { CANVAS_BACKGROUND_COLOR, GAME_ROOT_ELEMENT_ID } from './constants'

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: GAME_ROOT_ELEMENT_ID,
  backgroundColor: CANVAS_BACKGROUND_COLOR,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
  },
}
