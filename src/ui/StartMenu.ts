import { loadProgress } from '../persistence/storage'
import { START_MENU_CONTINUE, START_MENU_NEW_GAME, START_MENU_START, START_MENU_TITLE } from './copy'
import { requestFullscreenIfSupported } from './fullscreen'
import styles from './StartMenu.module.css'

export interface StartMenuHandlers {
  onContinue: () => void
  onNewGame: () => void
}

export function mountStartMenu(root: HTMLElement, handlers: StartMenuHandlers): void {
  const overlay = document.createElement('div')
  overlay.className = styles.overlay

  const title = document.createElement('h1')
  title.className = styles.title
  title.textContent = START_MENU_TITLE
  overlay.appendChild(title)

  const hasSavedProgress = loadProgress() !== null

  if (hasSavedProgress) {
    const continueButton = document.createElement('button')
    continueButton.className = styles.button
    continueButton.textContent = START_MENU_CONTINUE
    continueButton.addEventListener('click', () => {
      requestFullscreenIfSupported()
      overlay.remove()
      handlers.onContinue()
    })
    overlay.appendChild(continueButton)
  }

  const newGameButton = document.createElement('button')
  newGameButton.className = styles.button
  newGameButton.textContent = hasSavedProgress ? START_MENU_NEW_GAME : START_MENU_START
  newGameButton.addEventListener('click', () => {
    requestFullscreenIfSupported()
    overlay.remove()
    handlers.onNewGame()
  })
  overlay.appendChild(newGameButton)

  root.appendChild(overlay)
}
