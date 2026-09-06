import { loadProgress, saveProgress } from '../persistence/storage'
import { $levelCompleted, $money } from './store'

export function initPersistence(): void {
  const saved = loadProgress()
  if (saved) {
    $money.set(saved.money)
    $levelCompleted.set(saved.levelCompleted)
  }

  $money.subscribe(persist)
  $levelCompleted.subscribe(persist)
}

function persist(): void {
  saveProgress({ money: $money.get(), levelCompleted: $levelCompleted.get() })
}
