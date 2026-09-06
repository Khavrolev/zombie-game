import Phaser from 'phaser'
import { RAKE_COLOR, RAKE_SIZE } from '../constants'

export class Rake extends Phaser.GameObjects.Rectangle {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, RAKE_SIZE, RAKE_SIZE, RAKE_COLOR)
    scene.add.existing(this)
  }
}
