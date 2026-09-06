import Phaser from 'phaser'
import { MONEY_DROP_COLOR, MONEY_DROP_SIZE } from '../constants'

export class MoneyDrop extends Phaser.GameObjects.Rectangle {
  droppedAt: number
  amount: number

  constructor(scene: Phaser.Scene, x: number, y: number, amount: number, now: number) {
    super(scene, x, y, MONEY_DROP_SIZE, MONEY_DROP_SIZE, MONEY_DROP_COLOR)
    this.amount = amount
    this.droppedAt = now
    scene.add.existing(this)
    this.setInteractive({ cursor: 'pointer' })
  }
}
