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
    const parsed = JSON.parse(raw)
    if (
      typeof parsed?.money !== 'number' ||
      !Number.isFinite(parsed.money) ||
      typeof parsed?.levelCompleted !== 'boolean'
    ) {
      return null
    }
    return parsed as Progress
  } catch {
    return null
  }
}
