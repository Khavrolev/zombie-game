import Phaser from 'phaser'

export class Rake extends Phaser.GameObjects.Rectangle {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 20, 20, 0x8b5a2b)
    scene.add.existing(this)
  }
}
