import { $money } from '../state/store'
import styles from './Hud.module.css'

export function mountHud(root: HTMLElement): void {
  const el = document.createElement('div')
  el.className = styles.hud
  root.appendChild(el)

  $money.subscribe((value) => {
    el.textContent = `Деньги: ${value}`
  })
}
