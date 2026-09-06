import Phaser from 'phaser'
import { SOLDIER_COLOR, SOLDIER_MAX_HP, SOLDIER_SIZE } from '../constants'

export class Soldier extends Phaser.GameObjects.Rectangle {
  hp = SOLDIER_MAX_HP

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, SOLDIER_SIZE, SOLDIER_SIZE, SOLDIER_COLOR)
    scene.add.existing(this)
    this.setInteractive({ cursor: 'pointer' })
  }
}
