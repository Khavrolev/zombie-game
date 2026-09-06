import { GAME_OUTCOME_EVENT } from '../game/constants'
import { OUTCOME_LOST_MESSAGE, OUTCOME_RESTART_BUTTON, OUTCOME_WON_MESSAGE } from './copy'
import styles from './Outcome.module.css'

export function mountOutcomeOverlay(root: HTMLElement): void {
  const overlay = document.createElement('div')
  overlay.className = styles.overlay
  overlay.hidden = true

  const message = document.createElement('p')
  overlay.appendChild(message)

  const restartButton = document.createElement('button')
  restartButton.className = styles.button
  restartButton.textContent = OUTCOME_RESTART_BUTTON
  restartButton.addEventListener('click', () => window.location.reload())
  overlay.appendChild(restartButton)

  window.addEventListener(GAME_OUTCOME_EVENT, (event) => {
    const outcome = (event as CustomEvent<'won' | 'lost'>).detail
    message.textContent = outcome === 'won' ? OUTCOME_WON_MESSAGE : OUTCOME_LOST_MESSAGE
    overlay.hidden = false
  })

  root.appendChild(overlay)
}
