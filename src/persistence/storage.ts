export interface Progress {
  money: number
  levelCompleted: boolean
}

const STORAGE_KEY = 'zombie-game:progress'

export function saveProgress(progress: Progress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function loadProgress(): Progress | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Progress
  } catch {
    return null
  }
}
