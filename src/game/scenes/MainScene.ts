import Phaser from 'phaser'
import { $cannonHp, addMoney, resetCannon, spendMoney } from '../../state/store'
import {
  CANNON_MAX_HP,
  CANNON_BURST_COUNT,
  CANNON_COOLDOWN_MS,
  CONTACT_RADIUS_PX,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  MONEY_SKY_AMOUNT,
  MONEY_SKY_INTERVAL_MS,
  MONEY_ZOMBIE_DROP_AMOUNT,
  RAKE_COST,
  SOLDIER_COOLDOWN_MS,
  SOLDIER_MAX_HP,
  ZOMBIE_ATTACK_INTERVAL_MS,
  ZOMBIE_SPAWN_X,
} from '../constants'
import { Rake } from '../entities/Rake'
import { Soldier } from '../entities/Soldier'
import { Zombie } from '../entities/Zombie'
import { getTotalZombieCount } from '../levels/level-utils'
import { canFire } from '../logic/cooldown'
import { applyHit, isDestroyed } from '../logic/durability'
import { getLevelOutcome } from '../logic/level-outcome'
import { moveToward } from '../logic/movement'
import { distance, nearestTargets } from '../logic/targeting'
import { MoneyDrop } from '../entities/MoneyDrop'
import type { LevelConfig } from '../levels/types'
import { isBlinking, isExpired } from '../logic/money-drop'

export class MainScene extends Phaser.Scene {
  private level!: LevelConfig
  private cannon!: Phaser.GameObjects.Rectangle
  private moneyDrops: MoneyDrop[] = []
  private zombies: Zombie[] = []
  private soldiers: Map<number, Soldier> = new Map()
  private soldierCooldowns = new Map<Soldier, number | null>()
  private rakes: Rake[] = []
  private rakePlacementActive = false
  private waveIndex = 0
  private spawnedInWave = 0
  private waveTimer?: Phaser.Time.TimerEvent
  private totalZombieCount = 0
  killedCount = 0
  private chestReached = false
  private outcomeResolved = false
  private lastCannonFiredAt: number | null = null

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
    this.cannon.on('pointerdown', () => this.fireCannon())

    this.time.addEvent({
      delay: MONEY_SKY_INTERVAL_MS,
      loop: true,
      callback: () => this.spawnSkyMoney(),
    })

    $cannonHp.subscribe((hp) => {
      this.cannon.setFillStyle(isDestroyed(hp) ? 0x555555 : 0x3355aa)
    })

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.rakePlacementActive) {
        this.tryPlaceRake(pointer.x, pointer.y)
      }
    })

    this.startWave(0)
  }

  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000
    const cannonAlive = !isDestroyed($cannonHp.get())

    for (const zombie of [...this.zombies]) {
      const nearbySoldier = [...this.soldiers.values()].find((s) => distance(zombie, s) <= CONTACT_RADIUS_PX)
      if (nearbySoldier) {
        this.attackSoldierIfReady(zombie, nearbySoldier)
        continue
      }

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

    for (const rake of [...this.rakes]) {
      const hit = this.zombies.find((z) => distance(z, rake) <= CONTACT_RADIUS_PX)
      if (hit) {
        this.hitZombie(hit)
        rake.destroy()
        this.rakes = this.rakes.filter((r) => r !== rake)
      }
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

  private fireCannon(): void {
    const now = this.time.now
    if (!canFire(this.lastCannonFiredAt, now, CANNON_COOLDOWN_MS)) return
    this.lastCannonFiredAt = now

    const targets = nearestTargets(this.cannon, this.zombies, CANNON_BURST_COUNT)
    for (const zombie of targets) {
      this.hitZombie(zombie)
    }
  }

  enterRakePlacement(): void {
    this.rakePlacementActive = true
  }

  private tryPlaceRake(x: number, y: number): void {
    this.rakePlacementActive = false
    if (!spendMoney(RAKE_COST)) return
    this.rakes.push(new Rake(this, x, y))
  }

  placeSoldier(): boolean {
    const slots = this.level.soldierSlots
    let slotIndex = -1
    for (let i = 0; i < slots.length; i++) {
      if (!this.soldiers.has(i)) {
        slotIndex = i
        break
      }
    }
    if (slotIndex === -1) return false

    const slot = slots[slotIndex]
    const soldier = new Soldier(this, slot.x, slot.y)
    this.soldiers.set(slotIndex, soldier)
    this.soldierCooldowns.set(soldier, null)
    soldier.on('pointerdown', () => this.fireSoldier(soldier))
    return true
  }

  private fireSoldier(soldier: Soldier): void {
    const now = this.time.now
    const last = this.soldierCooldowns.get(soldier) ?? null
    if (!canFire(last, now, SOLDIER_COOLDOWN_MS)) return
    this.soldierCooldowns.set(soldier, now)

    const [target] = nearestTargets(soldier, this.zombies, 1)
    if (target) {
      this.hitZombie(target)
    }
  }

  private attackSoldierIfReady(zombie: Zombie, soldier: Soldier): void {
    const now = this.time.now
    if (!canFire(zombie.lastAttackAt, now, ZOMBIE_ATTACK_INTERVAL_MS)) return
    zombie.lastAttackAt = now
    soldier.hp = applyHit(soldier.hp, SOLDIER_MAX_HP)
    if (isDestroyed(soldier.hp)) {
      this.removeSoldier(soldier)
    }
  }

  private removeSoldier(soldier: Soldier): void {
    soldier.destroy()
    for (const [index, s] of this.soldiers) {
      if (s === soldier) {
        this.soldiers.delete(index)
        break
      }
    }
    this.soldierCooldowns.delete(soldier)
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
