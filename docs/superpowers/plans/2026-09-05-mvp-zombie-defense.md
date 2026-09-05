# MVP Zombie Defense Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable single-level browser MVP of the zombie-defense game described in `CLAUDE.md` — a cannon that shoots the 4 nearest zombies on click, purchasable soldiers and rakes, falling money to collect, win/lose conditions, and money persisted across reloads — then deploy it to GitHub Pages.

**Architecture:** Phaser 3 renders the game field and owns all entities (cannon, zombies, soldiers, rakes, money drops) inside one `MainScene`. Game-rule decisions (targeting, cooldowns, movement, expiry, durability, win/lose) are pure, framework-free functions under `src/game/logic/`, unit-tested with Vitest — the Scene only calls them and applies results to Phaser objects. A level is a plain data object (`src/game/levels/`) describing its field layout and zombie waves — the Scene reads everything level-specific from that object instead of hardcoding it, so a second level is a new data file, not a Scene rewrite. Cross-cutting state (money, level-completed flag, cannon HP) lives in Nanostores atoms in `src/state/`; both the Phaser scene and the HTML/CSS UI layer read and write those atoms without knowing about each other. A thin persistence bridge mirrors the relevant atoms to `localStorage`.

**Tech Stack:** TypeScript, Phaser 3, Vite, Nanostores, Vitest (jsdom environment), CSS Modules + a global CSS-variables token file, GitHub Actions → GitHub Pages.

## Global Constraints

- TypeScript `strict: true` everywhere — no `any`.
- No Phaser physics plugin (Arcade/Matter) — movement, distance and targeting are custom pure functions in `src/game/logic/`, applied manually in the Scene's `update()`.
- All game-rule logic that doesn't need rendering must be a pure function under `src/game/logic/` (or `src/game/levels/` for level data helpers), with a Vitest test — this is what makes the game testable without a browser.
- All UI outside the Phaser canvas is plain DOM (no framework), styled with CSS Modules; every color/spacing/radius value comes from the CSS variables in `src/ui/styles/tokens.css` (no hardcoded hex values in component styles).
- Persistence is `localStorage` only, via `src/persistence/storage.ts` — no IndexedDB (see `CLAUDE.md` for why).
- Money is the only currency; costs and drop amounts below are concrete MVP defaults, easy to retune later (they live in one file, `src/game/constants.ts`, or in a level's data file for per-level values).
- **Level data is the seam for future content.** Field layout (cannon/chest/soldier-slot positions, background color) and the wave list (how many zombies, of which type, how often) live in a `LevelConfig` object per level (`src/game/levels/`), not in `MainScene` or in global constants. `MainScene` is generic over whichever `LevelConfig` it's given via `init(data)`. Adding level 2 means adding a new `LevelConfig` + `ZombieType` data file, not touching `MainScene`. Only one level (`level1`) is wired up in this plan — a level-select screen is out of scope here.
- Damaging a zombie always goes through `MainScene.hitZombie(zombie, damage = 1)`, never a direct kill — this is the seam for future tougher zombie types (`ZombieType.hp > 1`) without touching any shooter's code.
- **Primary target is phone/tablet, landscape orientation.** The game is built mobile-first: Phaser's Scale Manager (`Phaser.Scale.FIT` + `CENTER_BOTH`) scales the fixed 960×540 design resolution to fill whatever screen it's on, the HTML/CSS UI layer tracks the actual rendered canvas rect (not the raw viewport) so buttons stay aligned at any size, and a CSS overlay asks the player to rotate to landscape on small portrait screens. Desktop with a mouse keeps working unmodified — Phaser's pointer events already unify touch and mouse input, so no separate touch-handling code is needed anywhere in the plan.

**Assumptions filling gaps the approved spec left open** (flag these to the user at plan review — they narrow underspecified rules):
- **Persistence scope:** only `money` and `levelCompleted` (a boolean) persist across reloads. Mid-level state (zombie positions, placed soldiers/rakes, cannon/soldier HP, wave progress) resets every time the level (re)starts — matching how most casual browser games handle "continue where you left off" (resume at the level, not mid-battle).
- **Melee combat model:** a zombie that reaches the cannon, or a soldier, stops advancing and attacks that target once every 5 seconds (`ZOMBIE_ATTACK_INTERVAL_MS`) until either the target is destroyed (zombie then resumes walking toward its next goal) or the zombie itself is killed by cannon/soldier/rake. The zombie never disappears from a melee hit by itself.
- **Cannon:** 5 HP, destroyed after 5 zombie hits (from the approved spec). **Soldiers:** 2 HP, destroyed after 2 zombie hits (this session's addition) — soldier slots become buyable again once a soldier there is destroyed (see Task 16).
- **The chest is a binary trigger, not a durable target** — a zombie touching it (only possible once the cannon is destroyed) ends the level as a loss immediately; there's no "chest HP" to whittle down.
- **Single fixed wave for the MVP level:** `level1` has one wave of 10 basic zombies, one every 4 seconds, from the field's right edge. The spec explicitly deferred wave/level composition — this is the minimum needed for a playable MVP. The `LevelConfig`/`WaveConfig` shape (Task 10) is what lets future levels vary location, zombie counts, wave counts, and zombie types without a rewrite.
- **Concrete tunable numbers** not specified in the spec: rake cost 30, soldier cost 50, sky money drop 50, zombie money drop 10, field size 960×540, cannon at `(80, 270)`, chest at `(20, 270)`, 4 soldier slots. Global ones live in `src/game/constants.ts`; level-specific ones live in `src/game/levels/level1.ts`.
- **Portrait handling is a soft CSS prompt, not a hard orientation lock.** The Screen Orientation API's `lock()` only works for a page in fullscreen mode and isn't supported on iOS Safari, so it can't reliably force landscape on a web page (only in an installed PWA/fullscreen context). Instead, a CSS media query (`orientation: portrait` and a narrow-enough viewport, so it doesn't affect desktop windows resized to be tall) shows a "rotate your device" overlay and hides the game until the device is turned. This is the standard, robust approach for a browser game and needs no extra permissions.

---

## File Structure

```
index.html
vite.config.ts
tsconfig.json
package.json
src/
  main.ts
  game/
    types.ts
    constants.ts
    config.ts
    scenes/MainScene.ts
    entities/{Zombie,Soldier,Rake,MoneyDrop}.ts
    levels/{types,zombie-types,level1,level-utils}.ts
    logic/{targeting,cooldown,movement,money-drop,durability,level-outcome}.ts
  state/
    store.ts
    persistence-bridge.ts
  persistence/
    storage.ts
  ui/
    Hud.ts
    Shop.ts
    Outcome.ts
    styles/tokens.css
    Hud.module.css
    Shop.module.css
    Outcome.module.css
  utils/
    clamp.ts
.github/workflows/deploy.yml
```

---

### Task 1: Project scaffold + toolchain smoke test

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/game/types.ts`
- Create: `src/game/constants.ts`
- Create: `src/ui/styles/tokens.css`
- Create: `src/utils/clamp.ts`
- Test: `src/utils/clamp.test.ts`

**Interfaces:**
- Produces: `Point { x: number; y: number }` (`src/game/types.ts`), every constant listed below (`src/game/constants.ts`), `clamp(value: number, min: number, max: number): number` (`src/utils/clamp.ts`).

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "zombie-game",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.6.2",
    "vite": "^5.4.8",
    "vitest": "^2.1.1",
    "jsdom": "^25.0.1"
  },
  "dependencies": {
    "phaser": "^3.85.2",
    "nanostores": "^0.11.3"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
})
```

- [ ] **Step 4: Create `index.html`**

The viewport meta disables pinch-zoom (`maximum-scale=1.0, user-scalable=no`) so taps on cannon/soldier/money don't accidentally zoom the page — important on touch devices. `#rotate-overlay` is hidden by default and only shown by a CSS media query (Task 1, Step 5) on small portrait screens.

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
    />
    <title>Zombie Game</title>
  </head>
  <body>
    <div id="game-container">
      <div id="game-root"></div>
      <div id="ui-root"></div>
    </div>
    <div id="rotate-overlay">
      <p>Поверните устройство горизонтально</p>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `src/ui/styles/tokens.css`**

`#game-container` fills the whole viewport (not a fixed 960×540 box) — Phaser's Scale Manager (wired in Task 11) scales the fixed-resolution game to fit inside it on any phone/tablet screen. `#ui-root` only gets `position: absolute` here; its exact size and position are set from JS in Task 11 to track the actual rendered canvas rect, so HUD/shop buttons added in later tasks land on top of the game, not in the letterboxed bars. `touch-action: none` stops the browser from scrolling/pull-to-refreshing while playing.

```css
:root {
  --color-bg: #1b2a1b;
  --color-primary: #3355aa;
  --color-primary-hover: #4466cc;
  --color-danger: #a33333;
  --color-success: #2e8b57;
  --color-text: #f2f2f2;
  --color-panel-bg: rgba(0, 0, 0, 0.6);
  --spacing-sm: 4px;
  --spacing-md: 8px;
  --spacing-lg: 16px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --font-base: system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  height: 100%;
  overflow: hidden;
  background: var(--color-bg);
  font-family: var(--font-base);
}

#game-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  touch-action: none;
}

#ui-root {
  position: absolute;
  pointer-events: none;
}

#rotate-overlay {
  display: none;
  position: fixed;
  inset: 0;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 1.2rem;
  padding: var(--spacing-lg);
  z-index: 1000;
}

/* Small-screen heuristic (max-width) so a tall desktop window is never blocked — only phones/tablets held upright. */
@media (orientation: portrait) and (max-width: 900px) {
  #rotate-overlay {
    display: flex;
  }

  #game-container {
    display: none;
  }
}
```

- [ ] **Step 6: Create `src/game/types.ts`**

```ts
export interface Point {
  x: number
  y: number
}
```

- [ ] **Step 7: Create `src/game/constants.ts`**

```ts
import type { Point } from './types'

export const FIELD_WIDTH = 960
export const FIELD_HEIGHT = 540

export const CANNON_POSITION: Point = { x: 80, y: 270 }
export const CHEST_POSITION: Point = { x: 20, y: 270 }
export const CONTACT_RADIUS_PX = 24

export const CANNON_MAX_HP = 5
export const CANNON_COOLDOWN_MS = 10000
export const CANNON_BURST_COUNT = 4

export const SOLDIER_COOLDOWN_MS = 5000
export const SOLDIER_COST = 50
export const SOLDIER_MAX_HP = 2
export const SOLDIER_SLOTS: Point[] = [
  { x: 80, y: 150 },
  { x: 80, y: 390 },
  { x: 140, y: 210 },
  { x: 140, y: 330 },
]

export const RAKE_COST = 30

export const ZOMBIE_SPAWN_X = FIELD_WIDTH - 20
export const ZOMBIE_ATTACK_INTERVAL_MS = 5000

export const MONEY_SKY_INTERVAL_MS = 30000
export const MONEY_SKY_AMOUNT = 50
export const MONEY_ZOMBIE_DROP_AMOUNT = 10
export const MONEY_DROP_TTL_MS = 5000
export const MONEY_DROP_BLINK_MS = 2000
```

- [ ] **Step 8: Write the failing test for `clamp`**

```ts
// src/utils/clamp.test.ts
import { describe, expect, it } from 'vitest'
import { clamp } from './clamp'

describe('clamp', () => {
  it('returns the value when inside the range', () => {
    expect(clamp(3, 0, 5)).toBe(3)
  })

  it('returns min when value is below range', () => {
    expect(clamp(-1, 0, 5)).toBe(0)
  })

  it('returns max when value is above range', () => {
    expect(clamp(9, 0, 5)).toBe(5)
  })
})
```

- [ ] **Step 9: Install dependencies and run the test to verify it fails**

Run: `npm install && npm test`
Expected: FAIL — `src/utils/clamp.ts` does not exist yet.

- [ ] **Step 10: Implement `clamp`**

```ts
// src/utils/clamp.ts
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
```

- [ ] **Step 11: Run the test to verify it passes**

Run: `npm test`
Expected: PASS (3 tests)

- [ ] **Step 12: Create `src/main.ts` as a bootstrap placeholder and verify the dev server**

```ts
// src/main.ts
import './ui/styles/tokens.css'

const root = document.getElementById('game-root')
if (root) {
  root.textContent = 'Zombie game bootstrap OK'
}
```

Run: `npm run dev`, open the printed local URL.
Expected: page shows the text "Zombie game bootstrap OK" on a dark background — confirms Vite, TS and the CSS token file all work together. (This file is replaced with the real Phaser bootstrap in Task 11.)

- [ ] **Step 13: Commit**

```bash
git add package.json tsconfig.json vite.config.ts index.html src/main.ts src/game/types.ts src/game/constants.ts src/ui/styles/tokens.css src/utils/clamp.ts src/utils/clamp.test.ts package-lock.json
git commit -m "chore: scaffold Vite/TS/Vitest project with design tokens"
```

---

### Task 2: Targeting logic — nearest N candidates

**Files:**
- Create: `src/game/logic/targeting.ts`
- Test: `src/game/logic/targeting.test.ts`

**Interfaces:**
- Consumes: `Point` from `src/game/types.ts`.
- Produces: `distance(a: Point, b: Point): number`, `interface Targetable extends Point { id: string }`, `nearestTargets<T extends Targetable>(origin: Point, candidates: T[], count: number): T[]` — used by the cannon and soldier firing logic in Task 14/16.

- [ ] **Step 1: Write the failing tests**

```ts
// src/game/logic/targeting.test.ts
import { describe, expect, it } from 'vitest'
import { distance, nearestTargets } from './targeting'

describe('distance', () => {
  it('computes euclidean distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })
})

describe('nearestTargets', () => {
  const origin = { x: 0, y: 0 }
  const far = { id: 'far', x: 100, y: 0 }
  const near = { id: 'near', x: 1, y: 0 }
  const mid = { id: 'mid', x: 10, y: 0 }

  it('returns candidates sorted by ascending distance', () => {
    expect(nearestTargets(origin, [far, near, mid], 3)).toEqual([near, mid, far])
  })

  it('caps the result at count', () => {
    expect(nearestTargets(origin, [far, near, mid], 2)).toEqual([near, mid])
  })

  it('returns fewer than count when not enough candidates exist', () => {
    expect(nearestTargets(origin, [near], 4)).toEqual([near])
  })

  it('returns an empty array for no candidates', () => {
    expect(nearestTargets(origin, [], 4)).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `src/game/logic/targeting.ts` does not exist.

- [ ] **Step 3: Implement targeting logic**

```ts
// src/game/logic/targeting.ts
import type { Point } from '../types'

export interface Targetable extends Point {
  id: string
}

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function nearestTargets<T extends Targetable>(
  origin: Point,
  candidates: T[],
  count: number
): T[] {
  return [...candidates]
    .sort((a, b) => distance(origin, a) - distance(origin, b))
    .slice(0, count)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/logic/targeting.ts src/game/logic/targeting.test.ts
git commit -m "feat: add nearest-target selection logic"
```

---

### Task 3: Cooldown logic

**Files:**
- Create: `src/game/logic/cooldown.ts`
- Test: `src/game/logic/cooldown.test.ts`

**Interfaces:**
- Produces: `canFire(lastFiredAt: number | null, now: number, cooldownMs: number): boolean` — used by cannon (Task 14), soldier (Task 16), and zombie melee attacks (Task 13/16).

- [ ] **Step 1: Write the failing tests**

```ts
// src/game/logic/cooldown.test.ts
import { describe, expect, it } from 'vitest'
import { canFire } from './cooldown'

describe('canFire', () => {
  it('allows firing when never fired before', () => {
    expect(canFire(null, 1000, 10000)).toBe(true)
  })

  it('blocks firing before the cooldown elapses', () => {
    expect(canFire(1000, 5000, 10000)).toBe(false)
  })

  it('allows firing exactly at the cooldown boundary', () => {
    expect(canFire(1000, 11000, 10000)).toBe(true)
  })

  it('allows firing after the cooldown elapses', () => {
    expect(canFire(1000, 20000, 10000)).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement cooldown logic**

```ts
// src/game/logic/cooldown.ts
export function canFire(lastFiredAt: number | null, now: number, cooldownMs: number): boolean {
  if (lastFiredAt === null) return true
  return now - lastFiredAt >= cooldownMs
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/logic/cooldown.ts src/game/logic/cooldown.test.ts
git commit -m "feat: add reload cooldown logic"
```

---

### Task 4: Movement logic

**Files:**
- Create: `src/game/logic/movement.ts`
- Test: `src/game/logic/movement.test.ts`

**Interfaces:**
- Consumes: `Point` from `src/game/types.ts`.
- Produces: `moveToward(current: Point, target: Point, speedPxPerSec: number, deltaSeconds: number): Point` — used by zombie movement in Task 13.

- [ ] **Step 1: Write the failing tests**

```ts
// src/game/logic/movement.test.ts
import { describe, expect, it } from 'vitest'
import { moveToward } from './movement'

describe('moveToward', () => {
  it('steps toward the target along a straight horizontal line', () => {
    const result = moveToward({ x: 0, y: 0 }, { x: 100, y: 0 }, 10, 1)
    expect(result).toEqual({ x: 10, y: 0 })
  })

  it('does not overshoot the target when the step is larger than the distance', () => {
    const result = moveToward({ x: 0, y: 0 }, { x: 5, y: 0 }, 100, 1)
    expect(result).toEqual({ x: 5, y: 0 })
  })

  it('returns the same point when already at the target', () => {
    const result = moveToward({ x: 5, y: 5 }, { x: 5, y: 5 }, 50, 1)
    expect(result).toEqual({ x: 5, y: 5 })
  })

  it('moves diagonally toward the target', () => {
    const result = moveToward({ x: 0, y: 0 }, { x: 3, y: 4 }, 5, 1)
    expect(result.x).toBeCloseTo(3)
    expect(result.y).toBeCloseTo(4)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement movement logic**

```ts
// src/game/logic/movement.ts
import type { Point } from '../types'

export function moveToward(
  current: Point,
  target: Point,
  speedPxPerSec: number,
  deltaSeconds: number
): Point {
  const dx = target.x - current.x
  const dy = target.y - current.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const step = speedPxPerSec * deltaSeconds

  if (dist <= step) {
    return { x: target.x, y: target.y }
  }

  return {
    x: current.x + (dx / dist) * step,
    y: current.y + (dy / dist) * step,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/logic/movement.ts src/game/logic/movement.test.ts
git commit -m "feat: add straight-line movement logic"
```

---

### Task 5: Money-drop timing logic

**Files:**
- Create: `src/game/logic/money-drop.ts`
- Test: `src/game/logic/money-drop.test.ts`

**Interfaces:**
- Consumes: `MONEY_DROP_TTL_MS`, `MONEY_DROP_BLINK_MS` from `src/game/constants.ts`.
- Produces: `isExpired(droppedAt: number, now: number): boolean`, `isBlinking(droppedAt: number, now: number): boolean` — used by `MoneyDrop` handling in Task 12.

- [ ] **Step 1: Write the failing tests**

```ts
// src/game/logic/money-drop.test.ts
import { describe, expect, it } from 'vitest'
import { isBlinking, isExpired } from './money-drop'

describe('isExpired', () => {
  it('is not expired right after dropping', () => {
    expect(isExpired(0, 0)).toBe(false)
  })

  it('is not expired just before the 5s TTL', () => {
    expect(isExpired(0, 4999)).toBe(false)
  })

  it('is expired at the 5s TTL boundary', () => {
    expect(isExpired(0, 5000)).toBe(true)
  })
})

describe('isBlinking', () => {
  it('is not blinking right after dropping', () => {
    expect(isBlinking(0, 0)).toBe(false)
  })

  it('is not blinking just before the last 2s window', () => {
    expect(isBlinking(0, 2999)).toBe(false)
  })

  it('is blinking at the start of the last 2s window', () => {
    expect(isBlinking(0, 3000)).toBe(true)
  })

  it('is no longer blinking once expired', () => {
    expect(isBlinking(0, 5000)).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement money-drop timing logic**

```ts
// src/game/logic/money-drop.ts
import { MONEY_DROP_BLINK_MS, MONEY_DROP_TTL_MS } from '../constants'

export function isExpired(droppedAt: number, now: number): boolean {
  return now - droppedAt >= MONEY_DROP_TTL_MS
}

export function isBlinking(droppedAt: number, now: number): boolean {
  const age = now - droppedAt
  return age >= MONEY_DROP_TTL_MS - MONEY_DROP_BLINK_MS && age < MONEY_DROP_TTL_MS
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/logic/money-drop.ts src/game/logic/money-drop.test.ts
git commit -m "feat: add money-drop expiry and blink timing logic"
```

---

### Task 6: Durability logic

**Files:**
- Create: `src/game/logic/durability.ts`
- Test: `src/game/logic/durability.test.ts`

**Interfaces:**
- Consumes: `clamp` from `src/utils/clamp.ts`.
- Produces: `applyHit(hp: number, maxHp: number): number`, `isDestroyed(hp: number): boolean` — generic over any HP-bearing thing; used for the cannon (max 5) in Task 13 and for soldiers (max 2) in Task 16.

- [ ] **Step 1: Write the failing tests**

```ts
// src/game/logic/durability.test.ts
import { describe, expect, it } from 'vitest'
import { applyHit, isDestroyed } from './durability'

describe('applyHit', () => {
  it('reduces hp by one', () => {
    expect(applyHit(5, 5)).toBe(4)
  })

  it('never goes below zero', () => {
    expect(applyHit(0, 5)).toBe(0)
  })

  it('works the same regardless of maxHp, since it only clamps the floor', () => {
    expect(applyHit(2, 2)).toBe(1)
  })
})

describe('isDestroyed', () => {
  it('is destroyed at zero hp', () => {
    expect(isDestroyed(0)).toBe(true)
  })

  it('is not destroyed above zero hp', () => {
    expect(isDestroyed(1)).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement durability logic**

```ts
// src/game/logic/durability.ts
import { clamp } from '../../utils/clamp'

export function applyHit(hp: number, maxHp: number): number {
  return clamp(hp - 1, 0, maxHp)
}

export function isDestroyed(hp: number): boolean {
  return hp <= 0
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/logic/durability.ts src/game/logic/durability.test.ts
git commit -m "feat: add generic hit-point durability logic"
```

---

### Task 7: Level outcome logic

**Files:**
- Create: `src/game/logic/level-outcome.ts`
- Test: `src/game/logic/level-outcome.test.ts`

**Interfaces:**
- Produces: `type LevelOutcome = 'in-progress' | 'won' | 'lost'`, `getLevelOutcome(input: { zombiesRemaining: number; chestReached: boolean }): LevelOutcome` — used by `MainScene.checkOutcome()` in Task 13/18.

- [ ] **Step 1: Write the failing tests**

```ts
// src/game/logic/level-outcome.test.ts
import { describe, expect, it } from 'vitest'
import { getLevelOutcome } from './level-outcome'

describe('getLevelOutcome', () => {
  it('is in-progress while zombies remain and the chest is untouched', () => {
    expect(getLevelOutcome({ zombiesRemaining: 3, chestReached: false })).toBe('in-progress')
  })

  it('is won when no zombies remain and the chest was never reached', () => {
    expect(getLevelOutcome({ zombiesRemaining: 0, chestReached: false })).toBe('won')
  })

  it('is lost when the chest was reached', () => {
    expect(getLevelOutcome({ zombiesRemaining: 2, chestReached: true })).toBe('lost')
  })

  it('treats chest reached as lost even if zombies also hit zero', () => {
    expect(getLevelOutcome({ zombiesRemaining: 0, chestReached: true })).toBe('lost')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement level outcome logic**

```ts
// src/game/logic/level-outcome.ts
export type LevelOutcome = 'in-progress' | 'won' | 'lost'

export interface LevelOutcomeInput {
  zombiesRemaining: number
  chestReached: boolean
}

export function getLevelOutcome({ zombiesRemaining, chestReached }: LevelOutcomeInput): LevelOutcome {
  if (chestReached) return 'lost'
  if (zombiesRemaining <= 0) return 'won'
  return 'in-progress'
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/logic/level-outcome.ts src/game/logic/level-outcome.test.ts
git commit -m "feat: add level win/lose outcome logic"
```

---

### Task 8: Nanostores state

**Files:**
- Create: `src/state/store.ts`
- Test: `src/state/store.test.ts`

**Interfaces:**
- Consumes: `CANNON_MAX_HP` from `src/game/constants.ts`.
- Produces: `$money`, `$levelCompleted`, `$cannonHp` (nanostores atoms), `addMoney(amount: number): void`, `spendMoney(amount: number): boolean`, `resetCannon(): void` — used by the Scene (Task 13/14/17) and the UI layer (Task 15/16/17/18).

- [ ] **Step 1: Write the failing tests**

```ts
// src/state/store.test.ts
import { beforeEach, describe, expect, it } from 'vitest'
import { $cannonHp, $money, addMoney, resetCannon, spendMoney } from './store'

beforeEach(() => {
  $money.set(0)
  resetCannon()
})

describe('addMoney', () => {
  it('increases the money balance', () => {
    addMoney(50)
    expect($money.get()).toBe(50)
  })
})

describe('spendMoney', () => {
  it('deducts money and returns true when funds are sufficient', () => {
    addMoney(100)
    expect(spendMoney(30)).toBe(true)
    expect($money.get()).toBe(70)
  })

  it('leaves money unchanged and returns false when funds are insufficient', () => {
    addMoney(10)
    expect(spendMoney(30)).toBe(false)
    expect($money.get()).toBe(10)
  })
})

describe('resetCannon', () => {
  it('resets cannon hp to the max value', () => {
    $cannonHp.set(1)
    resetCannon()
    expect($cannonHp.get()).toBe(5)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the state store**

```ts
// src/state/store.ts
import { atom } from 'nanostores'
import { CANNON_MAX_HP } from '../game/constants'

export const $money = atom<number>(0)
export const $levelCompleted = atom<boolean>(false)
export const $cannonHp = atom<number>(CANNON_MAX_HP)

export function addMoney(amount: number): void {
  $money.set($money.get() + amount)
}

export function spendMoney(amount: number): boolean {
  const current = $money.get()
  if (current < amount) return false
  $money.set(current - amount)
  return true
}

export function resetCannon(): void {
  $cannonHp.set(CANNON_MAX_HP)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/state/store.ts src/state/store.test.ts
git commit -m "feat: add nanostores state for money and cannon hp"
```

---

### Task 9: localStorage persistence

**Files:**
- Create: `src/persistence/storage.ts`
- Create: `src/state/persistence-bridge.ts`
- Test: `src/persistence/storage.test.ts`
- Test: `src/state/persistence-bridge.test.ts`

**Interfaces:**
- Consumes: `$money`, `$levelCompleted` from `src/state/store.ts`.
- Produces: `interface Progress { money: number; levelCompleted: boolean }`, `saveProgress(progress: Progress): void`, `loadProgress(): Progress | null`, `initPersistence(): void` — `initPersistence` is called once from `src/main.ts` in Task 19.

- [ ] **Step 1: Write the failing tests for storage**

```ts
// src/persistence/storage.test.ts
import { beforeEach, describe, expect, it } from 'vitest'
import { loadProgress, saveProgress } from './storage'

beforeEach(() => {
  localStorage.clear()
})

describe('loadProgress', () => {
  it('returns null when nothing was saved', () => {
    expect(loadProgress()).toBeNull()
  })

  it('returns null when the stored value is corrupted JSON', () => {
    localStorage.setItem('zombie-game:progress', 'not json')
    expect(loadProgress()).toBeNull()
  })
})

describe('saveProgress / loadProgress round trip', () => {
  it('returns exactly what was saved', () => {
    saveProgress({ money: 120, levelCompleted: true })
    expect(loadProgress()).toEqual({ money: 120, levelCompleted: true })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement storage**

```ts
// src/persistence/storage.ts
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
```

- [ ] **Step 4: Run storage tests to verify they pass**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Write the failing tests for the persistence bridge**

```ts
// src/state/persistence-bridge.test.ts
import { beforeEach, describe, expect, it } from 'vitest'
import { loadProgress, saveProgress } from '../persistence/storage'
import { $levelCompleted, $money } from './store'
import { initPersistence } from './persistence-bridge'

beforeEach(() => {
  localStorage.clear()
  $money.set(0)
  $levelCompleted.set(false)
})

describe('initPersistence', () => {
  it('loads saved progress into the atoms on startup', () => {
    saveProgress({ money: 75, levelCompleted: true })
    initPersistence()
    expect($money.get()).toBe(75)
    expect($levelCompleted.get()).toBe(true)
  })

  it('persists atom changes back to storage', () => {
    initPersistence()
    $money.set(42)
    expect(loadProgress()).toEqual({ money: 42, levelCompleted: false })
  })
})
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — module does not exist.

- [ ] **Step 7: Implement the persistence bridge**

```ts
// src/state/persistence-bridge.ts
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
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/persistence/storage.ts src/persistence/storage.test.ts src/state/persistence-bridge.ts src/state/persistence-bridge.test.ts
git commit -m "feat: persist money and level-completed flag to localStorage"
```

---

### Task 10: Level configuration data

**Files:**
- Create: `src/game/levels/types.ts`
- Create: `src/game/levels/zombie-types.ts`
- Create: `src/game/levels/level1.ts`
- Create: `src/game/levels/level-utils.ts`
- Test: `src/game/levels/level-utils.test.ts`

**Interfaces:**
- Consumes: `Point` (`src/game/types.ts`), `CANNON_POSITION`/`CHEST_POSITION`/`SOLDIER_SLOTS` (`src/game/constants.ts`).
- Produces: `interface ZombieType { id: string; hp: number; speedPxPerSec: number; color: number }`, `interface WaveConfig { zombieType: ZombieType; count: number; spawnIntervalMs: number }`, `interface LevelConfig { id: number; backgroundColor: number; cannonPosition: Point; chestPosition: Point; soldierSlots: Point[]; waves: WaveConfig[] }`, `BASIC_ZOMBIE: ZombieType`, `level1: LevelConfig`, `getTotalZombieCount(level: LevelConfig): number` — `level1` and `getTotalZombieCount` are consumed by `MainScene` starting Task 11/13.

This is the seam that lets future levels vary location, wave composition and zombie types without changing `MainScene` — see Global Constraints.

- [ ] **Step 1: Create the level data types**

```ts
// src/game/levels/types.ts
import type { Point } from '../types'

export interface ZombieType {
  id: string
  hp: number
  speedPxPerSec: number
  color: number
}

export interface WaveConfig {
  zombieType: ZombieType
  count: number
  spawnIntervalMs: number
}

export interface LevelConfig {
  id: number
  backgroundColor: number
  cannonPosition: Point
  chestPosition: Point
  soldierSlots: Point[]
  waves: WaveConfig[]
}
```

- [ ] **Step 2: Create the basic zombie type**

```ts
// src/game/levels/zombie-types.ts
import type { ZombieType } from './types'

export const BASIC_ZOMBIE: ZombieType = {
  id: 'basic',
  hp: 1,
  speedPxPerSec: 40,
  color: 0x882222,
}
```

- [ ] **Step 3: Create level 1's data**

```ts
// src/game/levels/level1.ts
import { CANNON_POSITION, CHEST_POSITION, SOLDIER_SLOTS } from '../constants'
import type { LevelConfig } from './types'
import { BASIC_ZOMBIE } from './zombie-types'

export const level1: LevelConfig = {
  id: 1,
  backgroundColor: 0x2f4f2f,
  cannonPosition: CANNON_POSITION,
  chestPosition: CHEST_POSITION,
  soldierSlots: SOLDIER_SLOTS,
  waves: [{ zombieType: BASIC_ZOMBIE, count: 10, spawnIntervalMs: 4000 }],
}
```

- [ ] **Step 4: Write the failing test for `getTotalZombieCount`**

```ts
// src/game/levels/level-utils.test.ts
import { describe, expect, it } from 'vitest'
import { getTotalZombieCount } from './level-utils'
import type { LevelConfig } from './types'
import { BASIC_ZOMBIE } from './zombie-types'

const baseLevel: Omit<LevelConfig, 'waves'> = {
  id: 1,
  backgroundColor: 0x000000,
  cannonPosition: { x: 0, y: 0 },
  chestPosition: { x: 0, y: 0 },
  soldierSlots: [],
}

describe('getTotalZombieCount', () => {
  it('returns 0 for a level with no waves', () => {
    expect(getTotalZombieCount({ ...baseLevel, waves: [] })).toBe(0)
  })

  it('sums zombie counts across multiple waves', () => {
    const level: LevelConfig = {
      ...baseLevel,
      waves: [
        { zombieType: BASIC_ZOMBIE, count: 5, spawnIntervalMs: 1000 },
        { zombieType: BASIC_ZOMBIE, count: 8, spawnIntervalMs: 1000 },
      ],
    }
    expect(getTotalZombieCount(level)).toBe(13)
  })
})
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `src/game/levels/level-utils.ts` does not exist.

- [ ] **Step 6: Implement `getTotalZombieCount`**

```ts
// src/game/levels/level-utils.ts
import type { LevelConfig } from './types'

export function getTotalZombieCount(level: LevelConfig): number {
  return level.waves.reduce((sum, wave) => sum + wave.count, 0)
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/game/levels
git commit -m "feat: add data-driven level configuration for level 1"
```

---

### Task 11: Phaser bootstrap — level-driven static field, cannon, chest, responsive scaling

**Files:**
- Create: `src/game/config.ts`
- Create: `src/game/scenes/MainScene.ts`
- Create: `src/ui/sync-ui-bounds.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `LevelConfig`, `level1` (Task 10); `FIELD_WIDTH`/`FIELD_HEIGHT` (Task 1).
- Produces: `MainScene` (Phaser scene, key `'MainScene'`, reads its layout from `init(data: { level: LevelConfig })`), `gameConfig: Phaser.Types.Core.GameConfig` (uses `Phaser.Scale.FIT` so the fixed 960×540 design resolution fills any phone/tablet/desktop screen), `syncUiRootToCanvas(game: Phaser.Game, uiRoot: HTMLElement): void` — called once here and relied on by every later UI task (15/16/18) so their DOM elements land on the visible canvas, not the letterboxed bars.

This task has no automated test — it's the first visual milestone. Verify manually.

- [ ] **Step 1: Create the Phaser game config with FIT scaling (no scene listed — it's added with level data in `main.ts`)**

```ts
// src/game/config.ts
import Phaser from 'phaser'
import { FIELD_HEIGHT, FIELD_WIDTH } from './constants'

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: FIELD_WIDTH,
    height: FIELD_HEIGHT,
  },
}
```

`backgroundColor` here is the letterbox color shown outside the 960×540 game area when the screen's aspect ratio doesn't match exactly (e.g. a 4:3 tablet) — black keeps the bars unobtrusive. The level's own `backgroundColor` (Task 10) fills the actual play field on top of that.

- [ ] **Step 2: Create the scene with a level-driven static field, cannon and chest**

```ts
// src/game/scenes/MainScene.ts
import Phaser from 'phaser'
import type { LevelConfig } from '../levels/types'

export class MainScene extends Phaser.Scene {
  private level!: LevelConfig
  private cannon!: Phaser.GameObjects.Rectangle

  constructor() {
    super('MainScene')
  }

  init(data: { level: LevelConfig }): void {
    this.level = data.level
  }

  create(): void {
    this.cameras.main.setBackgroundColor(this.level.backgroundColor)

    this.add.rectangle(this.level.chestPosition.x, this.level.chestPosition.y, 24, 24, 0xd4af37)

    this.cannon = this.add.rectangle(
      this.level.cannonPosition.x,
      this.level.cannonPosition.y,
      32,
      32,
      0x3355aa
    )
    this.cannon.setInteractive()
    this.cannon.on('pointerdown', () => {
      console.log('cannon clicked')
    })
  }
}
```

- [ ] **Step 3: Create the UI-bounds sync helper**

`game.scale.canvasBounds` is the canvas's real on-screen position and size (it shrinks/letterboxes under `FIT` mode). This keeps `#ui-root` — and everything mounted inside it in later tasks — pinned exactly over the visible game area, on any screen size or aspect ratio.

```ts
// src/ui/sync-ui-bounds.ts
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
```

- [ ] **Step 4: Replace the bootstrap placeholder in `src/main.ts`, starting the scene with `level1`'s data and syncing the UI layer**

```ts
// src/main.ts
import Phaser from 'phaser'
import { gameConfig } from './game/config'
import { level1 } from './game/levels/level1'
import { MainScene } from './game/scenes/MainScene'
import { syncUiRootToCanvas } from './ui/sync-ui-bounds'
import './ui/styles/tokens.css'

const game = new Phaser.Game(gameConfig)
game.scene.add('MainScene', MainScene, true, { level: level1 })

const uiRoot = document.getElementById('ui-root')
if (uiRoot) {
  syncUiRootToCanvas(game, uiRoot)
}
```

- [ ] **Step 5: Verify manually**

Run: `npm run dev`, open the local URL. Use the browser devtools device toolbar to check a few phone/tablet sizes in landscape (e.g. 844×390, 1180×820) and confirm the field scales to fill the screen and stays centered with even letterboxing on mismatched aspect ratios.
Expected: a dark green 960×540 field (from `level1.backgroundColor`), scaled to fit the viewport; a small gold square (chest) near the left edge at `(20, 270)`; a blue square (cannon) at `(80, 270)` — both positions coming from `level1`. Clicking the blue square logs `cannon clicked` in the console at every tested size. Rotating the simulated device to portrait on a narrow screen replaces the game with the "Поверните устройство горизонтально" overlay from Task 1.

- [ ] **Step 6: Commit**

```bash
git add src/game/config.ts src/game/scenes/MainScene.ts src/ui/sync-ui-bounds.ts src/main.ts
git commit -m "feat: bootstrap Phaser scene with responsive scaling and level-driven field layout"
```

---

### Task 12: Money-drop entity — sky drops and collection

**Files:**
- Create: `src/game/entities/MoneyDrop.ts`
- Modify: `src/game/scenes/MainScene.ts` — add sky-drop spawning, click-to-collect, and expiry/blink handling.

**Interfaces:**
- Consumes: `isExpired`/`isBlinking` (Task 5), `addMoney` (Task 8), `MONEY_SKY_INTERVAL_MS`/`MONEY_SKY_AMOUNT`/`FIELD_WIDTH`/`FIELD_HEIGHT` (Task 1).
- Produces: `class MoneyDrop extends Phaser.GameObjects.Rectangle { droppedAt: number; amount: number }`; `MainScene.spawnMoneyDrop(x: number, y: number, amount: number): void` — reused by `MainScene.killZombie` in Task 13 to drop money where a zombie died.

This task has no automated test — verify manually.

- [ ] **Step 1: Create the `MoneyDrop` entity**

```ts
// src/game/entities/MoneyDrop.ts
import Phaser from 'phaser'

export class MoneyDrop extends Phaser.GameObjects.Rectangle {
  droppedAt: number
  amount: number

  constructor(scene: Phaser.Scene, x: number, y: number, amount: number, now: number) {
    super(scene, x, y, 18, 18, 0x2e8b57)
    this.amount = amount
    this.droppedAt = now
    scene.add.existing(this)
    this.setInteractive()
  }
}
```

- [ ] **Step 2: Extend `MainScene` with money-drop spawning, collection and expiry**

Add these imports to `src/game/scenes/MainScene.ts`:

```ts
import { MoneyDrop } from '../entities/MoneyDrop'
import { isBlinking, isExpired } from '../logic/money-drop'
import { addMoney } from '../../state/store'
import { FIELD_HEIGHT, FIELD_WIDTH, MONEY_SKY_AMOUNT, MONEY_SKY_INTERVAL_MS } from '../constants'
```

Add a field:

```ts
  private moneyDrops: MoneyDrop[] = []
```

Add, at the end of `create()`:

```ts
    this.time.addEvent({
      delay: MONEY_SKY_INTERVAL_MS,
      loop: true,
      callback: () => this.spawnSkyMoney(),
    })
```

Add these methods to the class:

```ts
  private spawnSkyMoney(): void {
    const x = Phaser.Math.Between(40, FIELD_WIDTH - 40)
    const y = Phaser.Math.Between(40, FIELD_HEIGHT - 40)
    this.spawnMoneyDrop(x, y, MONEY_SKY_AMOUNT)
  }

  spawnMoneyDrop(x: number, y: number, amount: number): void {
    const drop = new MoneyDrop(this, x, y, amount, this.time.now)
    drop.on('pointerdown', () => {
      addMoney(drop.amount)
      this.removeMoneyDrop(drop)
    })
    this.moneyDrops.push(drop)
  }

  private removeMoneyDrop(drop: MoneyDrop): void {
    drop.destroy()
    this.moneyDrops = this.moneyDrops.filter((d) => d !== drop)
  }
```

Add an `update()` method with the expiry/blink loop (this is the first task to need `update()` — Task 13 will extend it with zombie movement):

```ts
  update(): void {
    for (const drop of [...this.moneyDrops]) {
      if (isExpired(drop.droppedAt, this.time.now)) {
        this.removeMoneyDrop(drop)
        continue
      }
      const blinkVisible = !isBlinking(drop.droppedAt, this.time.now) || Math.floor(this.time.now / 150) % 2 === 0
      drop.setVisible(blinkVisible)
    }
  }
```

- [ ] **Step 3: Verify manually**

Run: `npm run dev`, wait up to 30s.
Expected: a green square appears at a random field position; clicking it removes it and adds its amount to `$money` (visible once the HUD exists in Task 15 — for now, confirm via a temporary `console.log($money.get())` in the click handler, then remove it before committing). Left uncollected, it starts blinking after 3s and disappears at 5s.

- [ ] **Step 4: Commit**

```bash
git add src/game/entities/MoneyDrop.ts src/game/scenes/MainScene.ts
git commit -m "feat: spawn collectible sky money drops with expiry and blink"
```

---

### Task 13: Zombie entity — wave spawning, movement, and melee combat

**Files:**
- Create: `src/game/entities/Zombie.ts`
- Modify: `src/game/scenes/MainScene.ts` — add wave-based spawning, movement, cannon melee combat, and outcome checking.

**Interfaces:**
- Consumes: `ZombieType` (Task 10), `getTotalZombieCount` (Task 10), `moveToward` (Task 4), `distance` (Task 2), `canFire` (Task 3), `applyHit`/`isDestroyed` (Task 6), `getLevelOutcome` (Task 7), `$cannonHp`/`resetCannon` (Task 8), `MainScene.spawnMoneyDrop` (Task 12), `CONTACT_RADIUS_PX`/`CANNON_MAX_HP`/`ZOMBIE_ATTACK_INTERVAL_MS`/`ZOMBIE_SPAWN_X` (Task 1).
- Produces: `class Zombie extends Phaser.GameObjects.Rectangle { readonly id: string; hp: number; speedPxPerSec: number; lastAttackAt: number | null }`; `MainScene.hitZombie(zombie: Zombie, damage?: number): void`; `MainScene.killZombie(zombie: Zombie): void`; `MainScene.killedCount: number` — `hitZombie` is the seam every shooter (Task 14/16/17) calls to damage a zombie; `killZombie` centralizes the money drop and outcome check so shooters never duplicate that logic.

This task has no automated test — zombie behavior depends on Phaser's clock and rendering. Verify manually.

- [ ] **Step 1: Create the `Zombie` entity**

```ts
// src/game/entities/Zombie.ts
import Phaser from 'phaser'
import type { ZombieType } from '../levels/types'

let nextZombieId = 0

export class Zombie extends Phaser.GameObjects.Rectangle {
  readonly id: string
  hp: number
  speedPxPerSec: number
  lastAttackAt: number | null = null

  constructor(scene: Phaser.Scene, x: number, y: number, type: ZombieType) {
    super(scene, x, y, 20, 20, type.color)
    this.id = `zombie-${nextZombieId++}`
    this.hp = type.hp
    this.speedPxPerSec = type.speedPxPerSec
    scene.add.existing(this)
  }
}
```

- [ ] **Step 2: Extend `MainScene` with wave spawning, movement, melee combat and outcome checking**

Add imports to `src/game/scenes/MainScene.ts`:

```ts
import {
  CANNON_MAX_HP,
  CONTACT_RADIUS_PX,
  ZOMBIE_ATTACK_INTERVAL_MS,
  ZOMBIE_SPAWN_X,
} from '../constants'
import { Zombie } from '../entities/Zombie'
import { getTotalZombieCount } from '../levels/level-utils'
import { canFire } from '../logic/cooldown'
import { applyHit, isDestroyed } from '../logic/durability'
import { getLevelOutcome } from '../logic/level-outcome'
import { moveToward } from '../logic/movement'
import { distance } from '../logic/targeting'
import { $cannonHp, resetCannon } from '../../state/store'
```

Add fields:

```ts
  private zombies: Zombie[] = []
  private waveIndex = 0
  private spawnedInWave = 0
  private waveTimer?: Phaser.Time.TimerEvent
  private totalZombieCount = 0
  killedCount = 0
  private chestReached = false
  private outcomeResolved = false
```

Add, at the top of `create()`:

```ts
    resetCannon()
    this.totalZombieCount = getTotalZombieCount(this.level)
```

Add, at the end of `create()` (after the `MONEY_SKY_INTERVAL_MS` timer from Task 12):

```ts
    $cannonHp.subscribe((hp) => {
      this.cannon.setFillStyle(isDestroyed(hp) ? 0x555555 : 0x3355aa)
    })

    this.startWave(0)
```

Extend the `update()` method created in Task 12 — add this loop before the existing money-drop expiry loop:

```ts
    const deltaSeconds = this.game.loop.delta / 1000
    const cannonAlive = !isDestroyed($cannonHp.get())

    for (const zombie of [...this.zombies]) {
      const inCannonRange = cannonAlive && distance(zombie, this.level.cannonPosition) <= CONTACT_RADIUS_PX

      if (inCannonRange) {
        this.attackCannonIfReady(zombie)
        continue
      }

      const moveTarget = cannonAlive ? this.level.cannonPosition : this.level.chestPosition
      const next = moveToward(zombie, moveTarget, zombie.speedPxPerSec, deltaSeconds)
      zombie.setPosition(next.x, next.y)

      if (!cannonAlive && distance(zombie, this.level.chestPosition) <= CONTACT_RADIUS_PX) {
        this.chestReached = true
        this.removeZombie(zombie)
      }
    }

    this.checkOutcome()
```

Add these methods to the class:

```ts
  hitZombie(zombie: Zombie, damage = 1): void {
    zombie.hp -= damage
    if (zombie.hp <= 0) {
      this.killZombie(zombie)
    }
  }

  killZombie(zombie: Zombie): void {
    this.spawnMoneyDrop(zombie.x, zombie.y, MONEY_ZOMBIE_DROP_AMOUNT)
    this.removeZombie(zombie)
    this.killedCount += 1
    this.checkOutcome()
  }

  private attackCannonIfReady(zombie: Zombie): void {
    const now = this.time.now
    if (!canFire(zombie.lastAttackAt, now, ZOMBIE_ATTACK_INTERVAL_MS)) return
    zombie.lastAttackAt = now
    $cannonHp.set(applyHit($cannonHp.get(), CANNON_MAX_HP))
  }

  private startWave(index: number): void {
    const wave = this.level.waves[index]
    if (!wave) return
    this.spawnedInWave = 0
    this.waveTimer = this.time.addEvent({
      delay: wave.spawnIntervalMs,
      loop: true,
      callback: () => this.spawnZombieForWave(index),
    })
  }

  private spawnZombieForWave(index: number): void {
    const wave = this.level.waves[index]
    const y = Phaser.Math.Between(40, FIELD_HEIGHT - 40)
    const zombie = new Zombie(this, ZOMBIE_SPAWN_X, y, wave.zombieType)
    this.zombies.push(zombie)
    this.spawnedInWave += 1

    if (this.spawnedInWave >= wave.count) {
      this.waveTimer?.remove()
      this.waveIndex += 1
      this.startWave(this.waveIndex)
    }
  }

  private removeZombie(zombie: Zombie): void {
    zombie.destroy()
    this.zombies = this.zombies.filter((z) => z !== zombie)
  }

  private checkOutcome(): void {
    if (this.outcomeResolved) return
    const zombiesRemaining = this.totalZombieCount - this.killedCount
    const outcome = getLevelOutcome({ zombiesRemaining, chestReached: this.chestReached })
    if (outcome === 'in-progress') return
    this.outcomeResolved = true
    console.log('level outcome:', outcome)
  }
```

Add `MONEY_ZOMBIE_DROP_AMOUNT` to the existing `../constants` import line from Task 12.

- [ ] **Step 3: Verify manually**

Run: `npm run dev`.
Expected: a red zombie square spawns every 4s from the right edge at a random height and walks toward the cannon. Once a zombie is within melee range of the cannon it stops and the cannon flashes/changes are visible every 5s as it takes a hit (`applyHit`); after 5 total hits (possibly from several zombies attacking around the same time) the cannon turns gray. Zombies that were engaged with it then resume walking toward the gold chest square; once one touches it, the console logs `level outcome: lost`. Since nothing kills zombies yet in this task, `killedCount` stays 0.

- [ ] **Step 4: Commit**

```bash
git add src/game/entities/Zombie.ts src/game/scenes/MainScene.ts
git commit -m "feat: spawn zombie waves, move them toward the cannon, resolve melee combat"
```

---

### Task 14: Cannon firing

**Files:**
- Modify: `src/game/scenes/MainScene.ts` — replace the cannon's stub click handler with real firing logic.

**Interfaces:**
- Consumes: `nearestTargets` (Task 2), `canFire` (Task 3), `CANNON_COOLDOWN_MS`/`CANNON_BURST_COUNT` (Task 1), `MainScene.hitZombie` (Task 13).

This task has no automated test (it's the first real gameplay loop through Phaser's clock) — verify manually.

- [ ] **Step 1: Add cooldown state and imports**

Add to the imports in `src/game/scenes/MainScene.ts`:

```ts
import { nearestTargets } from '../logic/targeting'
import { CANNON_BURST_COUNT, CANNON_COOLDOWN_MS } from '../constants'
```

Add a field:

```ts
  private lastCannonFiredAt: number | null = null
```

- [ ] **Step 2: Replace the stub click handler in `create()`**

Change:

```ts
    this.cannon.on('pointerdown', () => {
      console.log('cannon clicked')
    })
```

to:

```ts
    this.cannon.on('pointerdown', () => this.fireCannon())
```

- [ ] **Step 3: Implement firing**

```ts
  private fireCannon(): void {
    const now = this.time.now
    if (!canFire(this.lastCannonFiredAt, now, CANNON_COOLDOWN_MS)) return
    this.lastCannonFiredAt = now

    const targets = nearestTargets(this.cannon, this.zombies, CANNON_BURST_COUNT)
    for (const zombie of targets) {
      this.hitZombie(zombie)
    }
  }
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`. Wait for a few zombies to spawn, then click the cannon.
Expected: up to 4 nearest zombies disappear immediately and each leaves a green money-drop square behind. Clicking the cannon again within 10s does nothing (still on cooldown); after 10s it fires again. Once `killedCount` reaches 10 (all zombies shot before any reach the cannon), the console logs `level outcome: won`.

- [ ] **Step 5: Commit**

```bash
git add src/game/scenes/MainScene.ts
git commit -m "feat: wire cannon click to fire at the 4 nearest zombies"
```

---

### Task 15: HUD — money counter

**Files:**
- Create: `src/ui/Hud.ts`
- Create: `src/ui/Hud.module.css`
- Modify: `src/main.ts` — mount the HUD.

**Interfaces:**
- Consumes: `$money` from `src/state/store.ts`.
- Produces: `mountHud(root: HTMLElement): void`.

This task has no automated test (DOM wiring is trivial and observed visually) — verify manually.

- [ ] **Step 1: Create `src/ui/Hud.module.css`**

```css
.hud {
  position: absolute;
  top: var(--spacing-md);
  left: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-panel-bg);
  color: var(--color-text);
  font-family: var(--font-base);
  border-radius: var(--radius-sm);
  pointer-events: none;
}
```

- [ ] **Step 2: Create `src/ui/Hud.ts`**

```ts
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
```

- [ ] **Step 3: Mount the HUD from `src/main.ts`**

```ts
// src/main.ts
import Phaser from 'phaser'
import { gameConfig } from './game/config'
import { level1 } from './game/levels/level1'
import { MainScene } from './game/scenes/MainScene'
import { mountHud } from './ui/Hud'
import { syncUiRootToCanvas } from './ui/sync-ui-bounds'
import './ui/styles/tokens.css'

const game = new Phaser.Game(gameConfig)
game.scene.add('MainScene', MainScene, true, { level: level1 })

const uiRoot = document.getElementById('ui-root')
if (uiRoot) {
  syncUiRootToCanvas(game, uiRoot)
  mountHud(uiRoot)
}
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`.
Expected: a "Деньги: 0" panel in the top-left corner. Collecting a sky money drop or a zombie kill's money drop increases the number live.

- [ ] **Step 5: Commit**

```bash
git add src/ui/Hud.ts src/ui/Hud.module.css src/main.ts
git commit -m "feat: add HUD money counter"
```

---

### Task 16: Soldier entity, fixed slots, shop panel

**Files:**
- Create: `src/game/entities/Soldier.ts`
- Create: `src/ui/Shop.ts`
- Create: `src/ui/Shop.module.css`
- Modify: `src/game/scenes/MainScene.ts` — add `placeSoldier()`, soldier firing, soldier melee combat (extends the zombie loop from Task 13), and `removeSoldier()`.
- Modify: `src/main.ts` — mount the shop panel.

**Interfaces:**
- Consumes: `canFire` (Task 3), `nearestTargets` (Task 2), `applyHit`/`isDestroyed` (Task 6), `spendMoney`/`$money` (Task 8), `SOLDIER_COST`/`SOLDIER_MAX_HP`/`SOLDIER_COOLDOWN_MS` (Task 1), `MainScene.hitZombie` (Task 13).
- Produces: `class Soldier extends Phaser.GameObjects.Rectangle { hp: number }`; `MainScene.placeSoldier(): void`; `mountShop(root: HTMLElement, handlers: ShopHandlers): void` with `interface ShopHandlers { onBuySoldier: () => void; onBuyRake: () => void }` (`onBuyRake` is declared now but only actually wired to a caller in Task 17).

This task has no automated test — verify manually.

- [ ] **Step 1: Create the `Soldier` entity**

```ts
// src/game/entities/Soldier.ts
import Phaser from 'phaser'
import { SOLDIER_MAX_HP } from '../constants'

export class Soldier extends Phaser.GameObjects.Rectangle {
  hp = SOLDIER_MAX_HP

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 24, 24, 0x557799)
    scene.add.existing(this)
    this.setInteractive()
  }
}
```

- [ ] **Step 2: Create `src/ui/Shop.module.css`**

```css
.panel {
  position: absolute;
  bottom: var(--spacing-md);
  left: var(--spacing-md);
  display: flex;
  gap: var(--spacing-md);
  pointer-events: none;
}

.button {
  pointer-events: auto;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-text);
  font-family: var(--font-base);
  cursor: pointer;
}

.button:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 3: Create `src/ui/Shop.ts`**

```ts
import { $money, spendMoney } from '../state/store'
import { RAKE_COST, SOLDIER_COST } from '../game/constants'
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
  soldierButton.textContent = `Солдат (${SOLDIER_COST})`
  soldierButton.addEventListener('click', () => {
    if (spendMoney(SOLDIER_COST)) {
      handlers.onBuySoldier()
    }
  })
  panel.appendChild(soldierButton)

  const rakeButton = document.createElement('button')
  rakeButton.className = styles.button
  rakeButton.textContent = `Грабли (${RAKE_COST})`
  rakeButton.addEventListener('click', () => handlers.onBuyRake())
  panel.appendChild(rakeButton)

  $money.subscribe((value) => {
    soldierButton.disabled = value < SOLDIER_COST
    rakeButton.disabled = value < RAKE_COST
  })

  root.appendChild(panel)
}
```

- [ ] **Step 4: Extend `MainScene` with soldier placement, firing and melee combat**

Add imports:

```ts
import { Soldier } from '../entities/Soldier'
import { SOLDIER_COOLDOWN_MS, SOLDIER_MAX_HP } from '../constants'
```

Add fields:

```ts
  private soldiers: Soldier[] = []
  private soldierCooldowns = new Map<Soldier, number | null>()
```

Add methods:

```ts
  placeSoldier(): void {
    if (this.soldiers.length >= this.level.soldierSlots.length) return
    const slot = this.level.soldierSlots[this.soldiers.length]
    const soldier = new Soldier(this, slot.x, slot.y)
    this.soldiers.push(soldier)
    this.soldierCooldowns.set(soldier, null)
    soldier.on('pointerdown', () => this.fireSoldier(soldier))
  }

  private fireSoldier(soldier: Soldier): void {
    const now = this.time.now
    const last = this.soldierCooldowns.get(soldier) ?? null
    if (!canFire(last, now, SOLDIER_COOLDOWN_MS)) return
    this.soldierCooldowns.set(soldier, now)

    const [target] = nearestTargets(soldier, this.zombies, 1)
    if (target) {
      this.hitZombie(target)
    }
  }

  private attackSoldierIfReady(zombie: Zombie, soldier: Soldier): void {
    const now = this.time.now
    if (!canFire(zombie.lastAttackAt, now, ZOMBIE_ATTACK_INTERVAL_MS)) return
    zombie.lastAttackAt = now
    soldier.hp = applyHit(soldier.hp, SOLDIER_MAX_HP)
    if (isDestroyed(soldier.hp)) {
      this.removeSoldier(soldier)
    }
  }

  private removeSoldier(soldier: Soldier): void {
    soldier.destroy()
    this.soldiers = this.soldiers.filter((s) => s !== soldier)
    this.soldierCooldowns.delete(soldier)
  }
```

Replace the per-zombie loop body added in Task 13's `update()` with this version, which checks for a nearby soldier before falling back to the cannon check:

```ts
    for (const zombie of [...this.zombies]) {
      const nearbySoldier = this.soldiers.find((s) => distance(zombie, s) <= CONTACT_RADIUS_PX)
      if (nearbySoldier) {
        this.attackSoldierIfReady(zombie, nearbySoldier)
        continue
      }

      const inCannonRange = cannonAlive && distance(zombie, this.level.cannonPosition) <= CONTACT_RADIUS_PX
      if (inCannonRange) {
        this.attackCannonIfReady(zombie)
        continue
      }

      const moveTarget = cannonAlive ? this.level.cannonPosition : this.level.chestPosition
      const next = moveToward(zombie, moveTarget, zombie.speedPxPerSec, deltaSeconds)
      zombie.setPosition(next.x, next.y)

      if (!cannonAlive && distance(zombie, this.level.chestPosition) <= CONTACT_RADIUS_PX) {
        this.chestReached = true
        this.removeZombie(zombie)
      }
    }
```

- [ ] **Step 5: Mount the shop from `src/main.ts` and wire `onBuySoldier`**

```ts
// src/main.ts
import Phaser from 'phaser'
import { gameConfig } from './game/config'
import { level1 } from './game/levels/level1'
import { MainScene } from './game/scenes/MainScene'
import { mountHud } from './ui/Hud'
import { mountShop } from './ui/Shop'
import { syncUiRootToCanvas } from './ui/sync-ui-bounds'
import './ui/styles/tokens.css'

const game = new Phaser.Game(gameConfig)
game.scene.add('MainScene', MainScene, true, { level: level1 })

const uiRoot = document.getElementById('ui-root')

if (uiRoot) {
  syncUiRootToCanvas(game, uiRoot)
  mountHud(uiRoot)
  mountShop(uiRoot, {
    onBuySoldier: () => {
      const scene = game.scene.getScene('MainScene') as MainScene
      scene.placeSoldier()
    },
    onBuyRake: () => {
      // wired in Task 17
    },
  })
}
```

- [ ] **Step 6: Verify manually**

Run: `npm run dev`. Collect enough sky money to afford a soldier (50), click "Солдат (50)".
Expected: money drops by 50, a blue-gray square appears at the first fixed slot near the cannon. Clicking it fires at the nearest zombie (kills it, drops money) with a 5s cooldown. If a zombie reaches the soldier instead, the soldier survives one hit and is destroyed on the second hit 5s later, freeing that slot for a new purchase. Buying more soldiers fills the next slots; the button greys out once money is below 50.

- [ ] **Step 7: Commit**

```bash
git add src/game/entities/Soldier.ts src/ui/Shop.ts src/ui/Shop.module.css src/game/scenes/MainScene.ts src/main.ts
git commit -m "feat: add soldier entity with 2-hit durability, fixed slots, and shop panel"
```

---

### Task 17: Rake entity and placement

**Files:**
- Create: `src/game/entities/Rake.ts`
- Modify: `src/game/scenes/MainScene.ts` — add rake placement mode, field-click handling, and zombie-overlap trigger.
- Modify: `src/main.ts` — wire `onBuyRake`.

**Interfaces:**
- Consumes: `spendMoney` (Task 8), `distance` (Task 2), `RAKE_COST`/`CONTACT_RADIUS_PX` (Task 1), `MainScene.hitZombie` (Task 13).
- Produces: `class Rake extends Phaser.GameObjects.Rectangle`; `MainScene.enterRakePlacement(): void`.

This task has no automated test — verify manually.

- [ ] **Step 1: Create the `Rake` entity**

```ts
// src/game/entities/Rake.ts
import Phaser from 'phaser'

export class Rake extends Phaser.GameObjects.Rectangle {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 20, 20, 0x8b5a2b)
    scene.add.existing(this)
  }
}
```

- [ ] **Step 2: Extend `MainScene` with rake placement and triggering**

Add imports:

```ts
import { Rake } from '../entities/Rake'
import { spendMoney } from '../../state/store'
import { RAKE_COST } from '../constants'
```

Add fields:

```ts
  private rakes: Rake[] = []
  private rakePlacementActive = false
```

Add, inside `create()`, a scene-wide click listener for placement:

```ts
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.rakePlacementActive) {
        this.tryPlaceRake(pointer.x, pointer.y)
      }
    })
```

Add methods:

```ts
  enterRakePlacement(): void {
    this.rakePlacementActive = true
  }

  private tryPlaceRake(x: number, y: number): void {
    this.rakePlacementActive = false
    if (!spendMoney(RAKE_COST)) return
    this.rakes.push(new Rake(this, x, y))
  }
```

Add, at the end of `update()` (after the money-drop expiry loop from Task 12), the zombie/rake overlap check:

```ts
    for (const rake of [...this.rakes]) {
      const hit = this.zombies.find((z) => distance(z, rake) <= CONTACT_RADIUS_PX)
      if (hit) {
        this.hitZombie(hit)
        rake.destroy()
        this.rakes = this.rakes.filter((r) => r !== rake)
      }
    }
```

- [ ] **Step 3: Wire `onBuyRake` in `src/main.ts`**

Replace:

```ts
    onBuyRake: () => {
      // wired in Task 17
    },
```

with:

```ts
    onBuyRake: () => {
      const scene = game.scene.getScene('MainScene') as MainScene
      scene.enterRakePlacement()
    },
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`. Collect 30+ money, click "Грабли (30)", then click anywhere on the field.
Expected: money drops by 30 and a brown square (rake) appears where you clicked. When a zombie walks over it, both the zombie and the rake disappear, a money drop is left behind, and `killedCount` increases (verify by letting the whole wave die this way and seeing `level outcome: won` logged).

- [ ] **Step 5: Commit**

```bash
git add src/game/entities/Rake.ts src/game/scenes/MainScene.ts src/main.ts
git commit -m "feat: add rake entity with click-to-place and zombie trigger"
```

---

### Task 18: Win/lose overlay

**Files:**
- Create: `src/ui/Outcome.ts`
- Create: `src/ui/Outcome.module.css`
- Modify: `src/game/scenes/MainScene.ts` — dispatch a `game:outcome` event and set `$levelCompleted` on win.
- Modify: `src/main.ts` — mount the overlay.

**Interfaces:**
- Consumes: `$levelCompleted` from `src/state/store.ts`.
- Produces: `mountOutcomeOverlay(root: HTMLElement): void`; a `window` `CustomEvent<'won' | 'lost'>` named `'game:outcome'`.

This task has no automated test (DOM + Phaser wiring, observed visually) — verify manually.

- [ ] **Step 1: Create `src/ui/Outcome.module.css`**

```css
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  background: var(--color-panel-bg);
  color: var(--color-text);
  font-family: var(--font-base);
  pointer-events: auto;
}

.button {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-text);
  cursor: pointer;
}

.button:hover {
  background: var(--color-primary-hover);
}
```

- [ ] **Step 2: Create `src/ui/Outcome.ts`**

```ts
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
```

- [ ] **Step 3: Dispatch the outcome event from `MainScene`**

Add an import to `src/game/scenes/MainScene.ts`:

```ts
import { $levelCompleted } from '../../state/store'
```

Replace the body of `checkOutcome()`:

```ts
  private checkOutcome(): void {
    if (this.outcomeResolved) return
    const zombiesRemaining = this.totalZombieCount - this.killedCount
    const outcome = getLevelOutcome({ zombiesRemaining, chestReached: this.chestReached })
    if (outcome === 'in-progress') return
    this.outcomeResolved = true
    if (outcome === 'won') {
      $levelCompleted.set(true)
    }
    window.dispatchEvent(new CustomEvent('game:outcome', { detail: outcome }))
  }
```

- [ ] **Step 4: Mount the overlay from `src/main.ts`**

Add the import and call:

```ts
import { mountOutcomeOverlay } from './ui/Outcome'
```

```ts
  mountOutcomeOverlay(uiRoot)
```

(inside the existing `if (uiRoot) { ... }` block, alongside `mountHud` and `mountShop`)

- [ ] **Step 5: Verify manually**

Run: `npm run dev`. Play through a full win (kill all 10 zombies) and, in a separate run, a full loss (let zombies destroy the cannon and reach the chest).
Expected: on win, an overlay reading "Уровень пройден!" with a "Заново" button appears. On loss, it reads "Пушка разрушена, зомби добрались до сундука". Clicking "Заново" reloads the page.

- [ ] **Step 6: Commit**

```bash
git add src/ui/Outcome.ts src/ui/Outcome.module.css src/game/scenes/MainScene.ts src/main.ts
git commit -m "feat: show win/lose overlay and persist level-completed on win"
```

---

### Task 19: Wire persistence bootstrap

**Files:**
- Modify: `src/main.ts` — call `initPersistence()` before mounting the UI.

**Interfaces:**
- Consumes: `initPersistence` from `src/state/persistence-bridge.ts` (Task 9).

This task has no automated test (it's a one-line wiring change already covered by Task 9's unit tests) — verify manually.

- [ ] **Step 1: Call `initPersistence()` at the top of `src/main.ts`**

```ts
// src/main.ts
import Phaser from 'phaser'
import { gameConfig } from './game/config'
import { level1 } from './game/levels/level1'
import { MainScene } from './game/scenes/MainScene'
import { initPersistence } from './state/persistence-bridge'
import { mountHud } from './ui/Hud'
import { mountOutcomeOverlay } from './ui/Outcome'
import { mountShop } from './ui/Shop'
import { syncUiRootToCanvas } from './ui/sync-ui-bounds'
import './ui/styles/tokens.css'

initPersistence()

const game = new Phaser.Game(gameConfig)
game.scene.add('MainScene', MainScene, true, { level: level1 })

const uiRoot = document.getElementById('ui-root')

if (uiRoot) {
  syncUiRootToCanvas(game, uiRoot)
  mountHud(uiRoot)
  mountOutcomeOverlay(uiRoot)
  mountShop(uiRoot, {
    onBuySoldier: () => {
      const scene = game.scene.getScene('MainScene') as MainScene
      scene.placeSoldier()
    },
    onBuyRake: () => {
      const scene = game.scene.getScene('MainScene') as MainScene
      scene.enterRakePlacement()
    },
  })
}
```

- [ ] **Step 2: Verify manually**

Run: `npm run dev`. Collect some money (e.g. one sky drop = 50), note the HUD value, then reload the page (F5).
Expected: the HUD shows the same money value immediately after reload — it was written to `localStorage` on every change and read back in `initPersistence()`. Confirm in devtools → Application → Local Storage that a `zombie-game:progress` key holds the matching JSON.

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: load and persist progress on app startup"
```

---

### Task 20: Deploy to GitHub Pages

**Files:**
- Modify: `vite.config.ts` — set the Pages base path.
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Set the Vite base path for GitHub Pages**

```ts
// vite.config.ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/zombie-game/',
  test: {
    environment: 'jsdom',
  },
})
```

- [ ] **Step 2: Create the deploy workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Commit and push**

```bash
git add vite.config.ts .github/workflows/deploy.yml
git commit -m "chore: deploy to GitHub Pages via GitHub Actions"
git push
```

- [ ] **Step 4: Enable Pages and verify (manual, one-time, requires repo admin access)**

In the GitHub repo settings → Pages, set "Source" to "GitHub Actions" (this UI step can't be done from git). Then check the Actions tab for a green run, and open `https://khavrolev.github.io/zombie-game/`.
Expected: the game loads and plays exactly as it does locally with `npm run dev`.

---

## Self-Review Notes

- **Spec coverage:** free-form field & movement (Task 13), cannon burst-of-4 with 10s cooldown (Task 14), soldier single-shot with 5s cooldown, fixed slots, and 2-hit durability (Task 16), cannon 5-hit durability and chest loss condition (Task 13), zombies that persist and attack every 5s rather than vanishing on contact (Task 13/16), rakes as single-use anywhere-placed traps (Task 17), sky money every 30s + zombie money drops with 5s/2s-blink expiry (Task 5, 12, 13), win = all zombies across all waves dead (Task 7, 13), money-only currency spent via `spendMoney` (Task 8, 16, 17), localStorage persistence of money/level-completed (Task 9, 19), data-driven level config so location/wave-count/zombie-count/zombie-type vary per level without touching `MainScene` (Task 10), mobile/tablet-first landscape play via Phaser's FIT scale mode, a canvas-tracking UI overlay, and a portrait rotate-prompt (Task 1, 11), CSS Modules + global token file (Task 1, 15, 16, 18), Nanostores as the game↔UI bridge (Task 8), GitHub Pages deploy (Task 20). Explicitly out of scope per the approved spec (not in this plan): a second level or level-select screen, additional zombie types beyond `BASIC_ZOMBIE`, and the cup-reward formula.
- **Type consistency checked:** `Zombie`/`Soldier`/`Rake`/`MoneyDrop` all extend `Phaser.GameObjects.Rectangle` and are constructed the same way (`super(scene, x, y, w, h, color)` + `scene.add.existing(this)`); `Zombie` carries `id`/`x`/`y` so it satisfies `Targetable` directly — no wrapper objects needed when calling `nearestTargets`; `applyHit(hp, maxHp)`'s two-argument signature (Task 6) is used consistently for both the cannon (`CANNON_MAX_HP`, Task 13) and soldiers (`SOLDIER_MAX_HP`, Task 16); every zombie kill goes through `hitZombie`/`killZombie` (Task 13) so `spawnMoneyDrop` and `checkOutcome` are never duplicated at a shooter's call site (Task 14/16/17 all just call `hitZombie`); `placeSoldier`, `enterRakePlacement`, `spawnMoneyDrop` are named and typed identically everywhere they're declared and called; `syncUiRootToCanvas` (Task 11) is called once, right after `game.scene.add(...)`, in every subsequent full `src/main.ts` listing (Task 15, 16, 19) so the UI layer never drifts out of sync with the canvas as the file grows.
