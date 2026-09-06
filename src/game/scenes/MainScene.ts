import Phaser from 'phaser'
import { $cannonHp, $levelCompleted, addMoney, resetCannon, spendMoney } from '../../state/store'
import {
  CANNON_BURST_COUNT,
  CANNON_COLOR_ALIVE,
  CANNON_COLOR_DESTROYED,
  CANNON_COOLDOWN_MS,
  CANNON_HP_PIP_OFFSET_Y,
  CANNON_MAX_HP,
  CANNON_RELOAD_BAR_OFFSET_Y,
  CANNON_SIZE,
  CHEST_COLOR,
  CHEST_SIZE,
  CONTACT_RADIUS_PX,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  GAME_OUTCOME_EVENT,
  HIT_PULSE_DURATION_MS,
  HIT_PULSE_SCALE,
  HP_PIP_COLOR_EMPTY,
  HP_PIP_COLOR_FULL,
  HP_PIP_GAP,
  HP_PIP_SIZE,
  MAIN_SCENE_KEY,
  MONEY_DROP_BLINK_FLICKER_MS,
  MONEY_DROP_DIM_ALPHA,
  MONEY_SKY_AMOUNT,
  MONEY_SKY_INTERVAL_MS,
  MONEY_ZOMBIE_DROP_AMOUNT,
  PAUSE_OVERLAY_ALPHA,
  PAUSE_OVERLAY_COLOR,
  PAUSE_OVERLAY_DEPTH,
  PAUSE_TEXT,
  PAUSE_TEXT_ALIGN,
  PAUSE_TEXT_COLOR,
  PAUSE_TEXT_FONT_SIZE,
  RAKE_COST,
  RELOAD_BAR_BG_ALPHA,
  RELOAD_BAR_BG_COLOR,
  RELOAD_BAR_FILL_COLOR,
  RELOAD_BAR_HEIGHT,
  RELOAD_BAR_WIDTH,
  SOLDIER_BURST_COUNT,
  SOLDIER_COOLDOWN_MS,
  SOLDIER_HP_PIP_OFFSET_Y,
  SOLDIER_MAX_HP,
  SOLDIER_RELOAD_BAR_OFFSET_Y,
  SPAWN_MARGIN_PX,
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
import type { Point } from '../types'
import { isBlinking, isExpired } from '../logic/money-drop'

export class MainScene extends Phaser.Scene {
  private level!: LevelConfig
  private cannon!: Phaser.GameObjects.Rectangle
  private chest!: Phaser.GameObjects.Rectangle
  private cannonHpPips!: Phaser.GameObjects.Graphics
  private moneyDrops: MoneyDrop[] = []
  private zombies: Zombie[] = []
  private soldiers: Map<number, Soldier> = new Map()
  private soldierCooldowns = new Map<Soldier, number | null>()
  private soldierReloadBars = new Map<Soldier, Phaser.GameObjects.Graphics>()
  private soldierHpPips = new Map<Soldier, Phaser.GameObjects.Graphics>()
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
  private cannonReloadBar!: Phaser.GameObjects.Graphics
  private isPaused = false
  private pauseOverlay!: Phaser.GameObjects.Container

  constructor() {
    super(MAIN_SCENE_KEY)
  }

  init(data: { level: LevelConfig }): void {
    this.level = data.level
  }

  create(): void {
    resetCannon()
    this.totalZombieCount = getTotalZombieCount(this.level)

    this.cameras.main.setBackgroundColor(this.level.backgroundColor)

    this.chest = this.add.rectangle(
      this.level.chestPosition.x,
      this.level.chestPosition.y,
      CHEST_SIZE,
      CHEST_SIZE,
      CHEST_COLOR
    )

    this.cannon = this.add.rectangle(
      this.level.cannonPosition.x,
      this.level.cannonPosition.y,
      CANNON_SIZE,
      CANNON_SIZE,
      CANNON_COLOR_ALIVE
    )
    this.cannon.setInteractive({ cursor: 'pointer' })
    this.cannon.on('pointerdown', () => this.fireCannon())

    this.cannonReloadBar = this.add.graphics()
    this.cannonHpPips = this.add.graphics()
    this.drawHpPips(this.cannonHpPips, this.level.cannonPosition, CANNON_MAX_HP, CANNON_MAX_HP, CANNON_HP_PIP_OFFSET_Y)

    this.time.addEvent({
      delay: MONEY_SKY_INTERVAL_MS,
      loop: true,
      callback: () => this.spawnSkyMoney(),
    })

    $cannonHp.subscribe((hp) => {
      const destroyed = isDestroyed(hp)
      this.cannon.setFillStyle(destroyed ? CANNON_COLOR_DESTROYED : CANNON_COLOR_ALIVE)
      if (destroyed) {
        this.cannon.disableInteractive()
      }
      this.drawHpPips(this.cannonHpPips, this.level.cannonPosition, hp, CANNON_MAX_HP, CANNON_HP_PIP_OFFSET_Y)
    })

    this.input.on(
      'pointerdown',
      (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
        if (this.rakePlacementActive && currentlyOver.length === 0) {
          this.tryPlaceRake(pointer.x, pointer.y)
        }
      }
    )

    const pauseBg = this.add.rectangle(
      FIELD_WIDTH / 2,
      FIELD_HEIGHT / 2,
      FIELD_WIDTH,
      FIELD_HEIGHT,
      PAUSE_OVERLAY_COLOR,
      PAUSE_OVERLAY_ALPHA
    )
    const pauseText = this.add
      .text(FIELD_WIDTH / 2, FIELD_HEIGHT / 2, PAUSE_TEXT, {
        fontSize: PAUSE_TEXT_FONT_SIZE,
        color: PAUSE_TEXT_COLOR,
        align: PAUSE_TEXT_ALIGN,
      })
      .setOrigin(0.5)
    this.pauseOverlay = this.add.container(0, 0, [pauseBg, pauseText])
    this.pauseOverlay.setDepth(PAUSE_OVERLAY_DEPTH)
    this.pauseOverlay.setVisible(false)

    this.input.keyboard?.on('keydown-ESC', () => this.togglePause())

    this.startWave(0)
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused
    this.pauseOverlay.setVisible(this.isPaused)
    if (this.isPaused) {
      this.scene.pause()
    } else {
      this.scene.resume()
    }
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
        this.pulseObject(this.chest)
        this.removeZombie(zombie)
      }
    }

    this.checkOutcome()
    this.drawReloadBar(this.cannonReloadBar, this.level.cannonPosition, this.lastCannonFiredAt, CANNON_COOLDOWN_MS, CANNON_RELOAD_BAR_OFFSET_Y)

    for (const [soldier, bar] of this.soldierReloadBars) {
      const lastFiredAt = this.soldierCooldowns.get(soldier) ?? null
      this.drawReloadBar(bar, soldier, lastFiredAt, SOLDIER_COOLDOWN_MS, SOLDIER_RELOAD_BAR_OFFSET_Y)
    }

    for (const drop of [...this.moneyDrops]) {
      if (isExpired(drop.droppedAt, this.time.now)) {
        this.removeMoneyDrop(drop)
        continue
      }
      const blinkVisible =
        !isBlinking(drop.droppedAt, this.time.now) ||
        Math.floor(this.time.now / MONEY_DROP_BLINK_FLICKER_MS) % 2 === 0
      drop.setAlpha(blinkVisible ? 1 : MONEY_DROP_DIM_ALPHA)
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
    const x = Phaser.Math.Between(SPAWN_MARGIN_PX, FIELD_WIDTH - SPAWN_MARGIN_PX)
    const y = Phaser.Math.Between(SPAWN_MARGIN_PX, FIELD_HEIGHT - SPAWN_MARGIN_PX)
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
    if (isDestroyed(zombie.hp)) {
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
    this.pulseObject(this.cannon)
  }

  private pulseObject(obj: Phaser.GameObjects.Rectangle): void {
    this.tweens.add({
      targets: obj,
      scale: HIT_PULSE_SCALE,
      duration: HIT_PULSE_DURATION_MS,
      yoyo: true,
      ease: 'Quad.easeOut',
    })
  }

  private drawHpPips(
    pips: Phaser.GameObjects.Graphics,
    position: Point,
    hp: number,
    maxHp: number,
    offsetY: number
  ): void {
    pips.clear()
    const totalWidth = maxHp * HP_PIP_SIZE + (maxHp - 1) * HP_PIP_GAP
    const startX = position.x - totalWidth / 2
    const y = position.y - offsetY

    for (let i = 0; i < maxHp; i++) {
      const x = startX + i * (HP_PIP_SIZE + HP_PIP_GAP)
      pips.fillStyle(i < hp ? HP_PIP_COLOR_FULL : HP_PIP_COLOR_EMPTY, 1)
      pips.fillRect(x, y, HP_PIP_SIZE, HP_PIP_SIZE)
    }
  }

  private drawReloadBar(
    bar: Phaser.GameObjects.Graphics,
    position: Point,
    lastFiredAt: number | null,
    cooldownMs: number,
    offsetY: number
  ): void {
    bar.clear()
    if (lastFiredAt === null) return

    const elapsed = this.time.now - lastFiredAt
    if (elapsed >= cooldownMs) return

    const progress = elapsed / cooldownMs
    const x = position.x - RELOAD_BAR_WIDTH / 2
    const y = position.y - offsetY

    bar.fillStyle(RELOAD_BAR_BG_COLOR, RELOAD_BAR_BG_ALPHA)
    bar.fillRect(x, y, RELOAD_BAR_WIDTH, RELOAD_BAR_HEIGHT)
    bar.fillStyle(RELOAD_BAR_FILL_COLOR, 1)
    bar.fillRect(x, y, RELOAD_BAR_WIDTH * progress, RELOAD_BAR_HEIGHT)
  }

  private fireCannon(): void {
    if (isDestroyed($cannonHp.get())) return
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

    const reloadBar = this.add.graphics()
    const hpPips = this.add.graphics()
    this.soldierReloadBars.set(soldier, reloadBar)
    this.soldierHpPips.set(soldier, hpPips)
    this.drawHpPips(hpPips, soldier, soldier.hp, SOLDIER_MAX_HP, SOLDIER_HP_PIP_OFFSET_Y)

    return true
  }

  private fireSoldier(soldier: Soldier): void {
    const now = this.time.now
    const last = this.soldierCooldowns.get(soldier) ?? null
    if (!canFire(last, now, SOLDIER_COOLDOWN_MS)) return
    this.soldierCooldowns.set(soldier, now)

    const [target] = nearestTargets(soldier, this.zombies, SOLDIER_BURST_COUNT)
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
    } else {
      this.pulseObject(soldier)
      const hpPips = this.soldierHpPips.get(soldier)
      if (hpPips) {
        this.drawHpPips(hpPips, soldier, soldier.hp, SOLDIER_MAX_HP, SOLDIER_HP_PIP_OFFSET_Y)
      }
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
    this.soldierReloadBars.get(soldier)?.destroy()
    this.soldierReloadBars.delete(soldier)
    this.soldierHpPips.get(soldier)?.destroy()
    this.soldierHpPips.delete(soldier)
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
    const y = Phaser.Math.Between(SPAWN_MARGIN_PX, FIELD_HEIGHT - SPAWN_MARGIN_PX)
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
    if (outcome === 'won') {
      $levelCompleted.set(true)
    }
    window.dispatchEvent(new CustomEvent(GAME_OUTCOME_EVENT, { detail: outcome }))
  }
}
