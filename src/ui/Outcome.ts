import styles from './Outcome.module.css'

export function mountOutcomeOverlay(root: HTMLElement): void {
  const overlay = document.createElement('div')
  overlay.className = styles.overlay
  overlay.hidden = true

  const message = document.createElement('p')
  overlay.appendChild(message)

  const restartButton = document.createElement('button')
  restartButton.className = styles.button
  restartButton.textContent = 'Заново'
  restartButton.addEventListener('click', () => window.location.reload())
  overlay.appendChild(restartButton)

  window.addEventListener('game:outcome', (event) => {
    const outcome = (event as CustomEvent<'won' | 'lost'>).detail
    message.textContent =
      outcome === 'won' ? 'Уровень пройден!' : 'Пушка разрушена, зомби добрались до сундука'
    overlay.hidden = false
  })

  root.appendChild(overlay)
}
