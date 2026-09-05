import Phaser from 'phaser'

export function syncUiRootToCanvas(game: Phaser.Game, uiRoot: HTMLElement): void {
  const apply = (): void => {
    const bounds = game.scale.canvasBounds
    uiRoot.style.left = `${bounds.x}px`
    uiRoot.style.top = `${bounds.y}px`
    uiRoot.style.width = `${bounds.width}px`
    uiRoot.style.height = `${bounds.height}px`
  }

  apply()
  game.scale.on(Phaser.Scale.Events.RESIZE, apply)
}
