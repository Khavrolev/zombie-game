import Phaser from 'phaser'
import { FIELD_HEIGHT, FIELD_WIDTH } from './constants'

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: FIELD_WIDTH,
    height: FIELD_HEIGHT,
  },
}
