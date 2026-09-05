import Phaser from 'phaser'
import { gameConfig } from './game/config'
import { level1 } from './game/levels/level1'
import { MainScene } from './game/scenes/MainScene'
import { mountHud } from './ui/Hud'
import { mountShop } from './ui/Shop'
import { syncUiRootToCanvas } from './ui/sync-ui-bounds'
import './ui/styles/tokens.css'

const game = new Phaser.Game(gameConfig)
game.scene.add('MainScene', MainScene, true, { level: level1 })

const uiRoot = document.getElementById('ui-root')

if (uiRoot) {
  syncUiRootToCanvas(game, uiRoot)
  mountHud(uiRoot)
  mountShop(uiRoot, {
    onBuySoldier: () => {
      const scene = game.scene.getScene('MainScene') as MainScene
      scene.placeSoldier()
    },
    onBuyRake: () => {
      // wired in Task 17
    },
  })
}
