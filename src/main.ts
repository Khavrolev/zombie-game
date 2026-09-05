import Phaser from 'phaser'
import { gameConfig } from './game/config'
import { level1 } from './game/levels/level1'
import { MainScene } from './game/scenes/MainScene'
import { addMoney } from './state/store'
import { SOLDIER_COST } from './game/constants'
import { mountHud } from './ui/Hud'
import { mountOutcomeOverlay } from './ui/Outcome'
import { mountShop } from './ui/Shop'
import { syncUiRootToCanvas } from './ui/sync-ui-bounds'
import './ui/styles/tokens.css'

const game = new Phaser.Game(gameConfig)
game.scene.add('MainScene', MainScene, true, { level: level1 })

const uiRoot = document.getElementById('ui-root')

if (uiRoot) {
  syncUiRootToCanvas(game, uiRoot)
  mountHud(uiRoot)
  mountOutcomeOverlay(uiRoot)
  mountShop(uiRoot, {
    onBuySoldier: () => {
      const scene = game.scene.getScene('MainScene') as MainScene
      if (!scene.placeSoldier()) {
        addMoney(SOLDIER_COST)
      }
    },
    onBuyRake: () => {
      const scene = game.scene.getScene('MainScene') as MainScene
      scene.enterRakePlacement()
    },
  })
}
