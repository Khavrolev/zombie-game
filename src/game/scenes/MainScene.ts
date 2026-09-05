import Phaser from 'phaser'
import type { LevelConfig } from '../levels/types'

export class MainScene extends Phaser.Scene {
  private level!: LevelConfig
  private cannon!: Phaser.GameObjects.Rectangle

  constructor() {
    super('MainScene')
  }

  init(data: { level: LevelConfig }): void {
    this.level = data.level
  }

  create(): void {
    this.cameras.main.setBackgroundColor(this.level.backgroundColor)

    this.add.rectangle(this.level.chestPosition.x, this.level.chestPosition.y, 24, 24, 0xd4af37)

    this.cannon = this.add.rectangle(
      this.level.cannonPosition.x,
      this.level.cannonPosition.y,
      32,
      32,
      0x3355aa
    )
    this.cannon.setInteractive()
    this.cannon.on('pointerdown', () => {
      console.log('cannon clicked')
    })
  }
}
