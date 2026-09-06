import Phaser from 'phaser'
import { gameConfig } from './game/config'
import { level1 } from './game/levels/level1'
import { MainScene } from './game/scenes/MainScene'
import { initPersistence } from './state/persistence-bridge'
import { addMoney, resetProgress } from './state/store'
import { MAIN_SCENE_KEY, SOLDIER_COST, UI_ROOT_ELEMENT_ID } from './game/constants'
import { mountHud } from './ui/Hud'
import { mountOutcomeOverlay } from './ui/Outcome'
import { mountShop } from './ui/Shop'
import { mountStartMenu } from './ui/StartMenu'
import { maskReflowOnOrientationChange } from './ui/reflow-overlay'
import { syncUiRootToCanvas } from './ui/sync-ui-bounds'
import './ui/styles/tokens.css'

initPersistence()

const game = new Phaser.Game(gameConfig)

const uiRoot = document.getElementById(UI_ROOT_ELEMENT_ID)

if (uiRoot) {
  syncUiRootToCanvas(game, uiRoot)
  maskReflowOnOrientationChange()
  mountHud(uiRoot)
  mountOutcomeOverlay(uiRoot)
  mountShop(uiRoot, {
    onBuySoldier: () => {
      const scene = game.scene.getScene(MAIN_SCENE_KEY) as MainScene
      if (!scene.placeSoldier()) {
        addMoney(SOLDIER_COST)
      }
    },
    onBuyRake: () => {
      const scene = game.scene.getScene(MAIN_SCENE_KEY) as MainScene
      scene.enterRakePlacement()
    },
  })

  const startGame = (): void => {
    game.scene.add(MAIN_SCENE_KEY, MainScene, true, { level: level1 })
  }

  mountStartMenu(uiRoot, {
    onContinue: startGame,
    onNewGame: () => {
      resetProgress()
      startGame()
    },
  })
}
