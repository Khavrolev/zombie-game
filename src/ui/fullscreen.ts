export function requestFullscreenIfSupported(): void {
  const el = document.documentElement
  if (!el.requestFullscreen) return
  el.requestFullscreen().catch(() => {
    // Fullscreen can be denied or unsupported (e.g. iOS Safari) — the game
    // still works windowed, so there is nothing to recover from here.
  })
}
