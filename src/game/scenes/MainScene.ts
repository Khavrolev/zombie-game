import Phaser from 'phaser'
import { addMoney } from '../../state/store'
import { FIELD_HEIGHT, FIELD_WIDTH, MONEY_SKY_AMOUNT, MONEY_SKY_INTERVAL_MS } from '../constants'
import { MoneyDrop } from '../entities/MoneyDrop'
import type { LevelConfig } from '../levels/types'
import { isBlinking, isExpired } from '../logic/money-drop'

export class MainScene extends Phaser.Scene {
  private level!: LevelConfig
  private cannon!: Phaser.GameObjects.Rectangle
  private moneyDrops: MoneyDrop[] = []

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

    this.time.addEvent({
      delay: MONEY_SKY_INTERVAL_MS,
      loop: true,
      callback: () => this.spawnSkyMoney(),
    })
  }

  update(_time: number, delta: number): void {
    for (const drop of [...this.moneyDrops]) {
      if (isExpired(drop.droppedAt, this.time.now)) {
        this.removeMoneyDrop(drop)
        continue
      }
      const blinkVisible = !isBlinking(drop.droppedAt, this.time.now) || Math.floor(this.time.now / 150) % 2 === 0
      drop.setVisible(blinkVisible)
    }
  }

  private spawnSkyMoney(): void {
    const x = Phaser.Math.Between(40, FIELD_WIDTH - 40)
    const y = Phaser.Math.Between(40, FIELD_HEIGHT - 40)
    this.spawnMoneyDrop(x, y, MONEY_SKY_AMOUNT)
  }

  spawnMoneyDrop(x: number, y: number, amount: number): void {
    const drop = new MoneyDrop(this, x, y, amount, this.time.now)
    drop.on('pointerdown', () => {
      addMoney(drop.amount)
      this.removeMoneyDrop(drop)
    })
    this.moneyDrops.push(drop)
  }

  private removeMoneyDrop(drop: MoneyDrop): void {
    drop.destroy()
    this.moneyDrops = this.moneyDrops.filter((d) => d !== drop)
  }
}
