import Phaser from 'phaser'

export class MoneyDrop extends Phaser.GameObjects.Rectangle {
  droppedAt: number
  amount: number

  constructor(scene: Phaser.Scene, x: number, y: number, amount: number, now: number) {
    super(scene, x, y, 18, 18, 0x2e8b57)
    this.amount = amount
    this.droppedAt = now
    scene.add.existing(this)
    this.setInteractive()
  }
}
