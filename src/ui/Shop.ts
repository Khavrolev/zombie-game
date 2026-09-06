import { $money, spendMoney } from '../state/store'
import { RAKE_COST, SOLDIER_COST } from '../game/constants'
import { SHOP_RAKE_LABEL, SHOP_SOLDIER_LABEL } from './copy'
import styles from './Shop.module.css'

export interface ShopHandlers {
  onBuySoldier: () => void
  onBuyRake: () => void
}

export function mountShop(root: HTMLElement, handlers: ShopHandlers): void {
  const panel = document.createElement('div')
  panel.className = styles.panel

  const soldierButton = document.createElement('button')
  soldierButton.className = styles.button
  soldierButton.textContent = SHOP_SOLDIER_LABEL(SOLDIER_COST)
  soldierButton.addEventListener('click', () => {
    if (spendMoney(SOLDIER_COST)) {
      handlers.onBuySoldier()
    }
  })
  panel.appendChild(soldierButton)

  const rakeButton = document.createElement('button')
  rakeButton.className = styles.button
  rakeButton.textContent = SHOP_RAKE_LABEL(RAKE_COST)
  rakeButton.addEventListener('click', () => handlers.onBuyRake())
  panel.appendChild(rakeButton)

  $money.subscribe((value) => {
    soldierButton.disabled = value < SOLDIER_COST
    rakeButton.disabled = value < RAKE_COST
  })

  root.appendChild(panel)
}
