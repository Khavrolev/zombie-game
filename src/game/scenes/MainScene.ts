import Phaser from 'phaser'
import { $cannonHp, addMoney, resetCannon } from '../../state/store'
import {
  CANNON_MAX_HP,
  CONTACT_RADIUS_PX,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  MONEY_SKY_AMOUNT,
  MONEY_SKY_INTERVAL_MS,
  MONEY_ZOMBIE_DROP_AMOUNT,
  ZOMBIE_ATTACK_INTERVAL_MS,
  ZOMBIE_SPAWN_X,
} from '../constants'
import { Zombie } from '../entities/Zombie'
import { getTotalZombieCount } from '../levels/level-utils'
import { canFire } from '../logic/cooldown'
import { applyHit, isDestroyed } from '../logic/durability'
import { getLevelOutcome } from '../logic/level-outcome'
import { moveToward } from '../logic/movement'
import { distance } from '../logic/targeting'
import { MoneyDrop } from '../entities/MoneyDrop'
import type { LevelConfig } from '../levels/types'
import { isBlinking, isExpired } from '../logic/money-drop'

export class MainScene extends Phaser.Scene {
  private level!: LevelConfig
  private cannon!: Phaser.GameObjects.Rectangle
  private moneyDrops: MoneyDrop[] = []
  private zombies: Zombie[] = []
  private waveIndex = 0
  private spawnedInWave = 0
  private waveTimer?: Phaser.Time.TimerEvent
  private totalZombieCount = 0
  killedCount = 0
  private chestReached = false
  private outcomeResolved = false

  constructor() {
    super('MainScene')
  }

  init(data: { level: LevelConfig }): void {
    this.level = data.level
  }

  create(): void {
    resetCannon()
    this.totalZombieCount = getTotalZombieCount(this.level)

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

    $cannonHp.subscribe((hp) => {
      this.cannon.setFillStyle(isDestroyed(hp) ? 0x555555 : 0x3355aa)
    })

    this.startWave(0)
  }

  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000
    const cannonAlive = !isDestroyed($cannonHp.get())

    for (const zombie of [...this.zombies]) {
      const inCannonRange = cannonAlive && distance(zombie, this.level.cannonPosition) <= CONTACT_RADIUS_PX

      if (inCannonRange) {
        this.attackCannonIfReady(zombie)
        continue
      }

      const moveTarget = cannonAlive ? this.level.cannonPosition : this.level.chestPosition
      const next = moveToward(zombie, moveTarget, zombie.speedPxPerSec, deltaSeconds)
      zombie.setPosition(next.x, next.y)

      if (!cannonAlive && distance(zombie, this.level.chestPosition) <= CONTACT_RADIUS_PX) {
        this.chestReached = true
        this.removeZombie(zombie)
      }
    }

    this.checkOutcome()

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

  hitZombie(zombie: Zombie, damage = 1): void {
    zombie.hp -= damage
    if (zombie.hp <= 0) {
      this.killZombie(zombie)
    }
  }

  killZombie(zombie: Zombie): void {
    this.spawnMoneyDrop(zombie.x, zombie.y, MONEY_ZOMBIE_DROP_AMOUNT)
    this.removeZombie(zombie)
    this.killedCount += 1
    this.checkOutcome()
  }

  private attackCannonIfReady(zombie: Zombie): void {
    const now = this.time.now
    if (!canFire(zombie.lastAttackAt, now, ZOMBIE_ATTACK_INTERVAL_MS)) return
    zombie.lastAttackAt = now
    $cannonHp.set(applyHit($cannonHp.get(), CANNON_MAX_HP))
  }

  private startWave(index: number): void {
    const wave = this.level.waves[index]
    if (!wave) return
    this.spawnedInWave = 0
    this.waveTimer = this.time.addEvent({
      delay: wave.spawnIntervalMs,
      loop: true,
      callback: () => this.spawnZombieForWave(index),
    })
  }

  private spawnZombieForWave(index: number): void {
    const wave = this.level.waves[index]
    const y = Phaser.Math.Between(40, FIELD_HEIGHT - 40)
    const zombie = new Zombie(this, ZOMBIE_SPAWN_X, y, wave.zombieType)
    this.zombies.push(zombie)
    this.spawnedInWave += 1

    if (this.spawnedInWave >= wave.count) {
      this.waveTimer?.remove()
      this.waveIndex += 1
      this.startWave(this.waveIndex)
    }
  }

  private removeZombie(zombie: Zombie): void {
    zombie.destroy()
    this.zombies = this.zombies.filter((z) => z !== zombie)
  }

  private checkOutcome(): void {
    if (this.outcomeResolved) return
    const zombiesRemaining = this.totalZombieCount - this.killedCount
    const outcome = getLevelOutcome({ zombiesRemaining, chestReached: this.chestReached })
    if (outcome === 'in-progress') return
    this.outcomeResolved = true
    console.log('level outcome:', outcome)
  }
}
