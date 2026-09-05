import Phaser from 'phaser'
import { SOLDIER_MAX_HP } from '../constants'

export class Soldier extends Phaser.GameObjects.Rectangle {
  hp = SOLDIER_MAX_HP

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 24, 24, 0x557799)
    scene.add.existing(this)
    this.setInteractive()
  }
}
