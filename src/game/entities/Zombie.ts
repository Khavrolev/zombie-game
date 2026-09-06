import Phaser from 'phaser'
import type { ZombieType } from '../levels/types'

let nextZombieId = 0

export class Zombie extends Phaser.GameObjects.Rectangle {
  readonly id: string
  hp: number
  speedPxPerSec: number
  lastAttackAt: number | null = null

  constructor(scene: Phaser.Scene, x: number, y: number, type: ZombieType) {
    super(scene, x, y, type.size, type.size, type.color)
    this.id = `zombie-${nextZombieId++}`
    this.hp = type.hp
    this.speedPxPerSec = type.speedPxPerSec
    scene.add.existing(this)
  }
}
