---
description: "Coding style, CSS color/class rules, React patterns. CardTeur project specific."
applyTo: "**"
---

# CardTeur Coding Rules

## CSS & Theme
- Dark theme colors: background `#1A2B42`, panel bg `rgba(36, 59, 90, 0.75)`, accent `#00deec`, error `#ff6b6b`
- Headers matching the navbar style: `background: rgba(36, 59, 90, 0.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.1); height: 64px`
- All buttons use the `.btn-ct` class, active/cancel state is toggled with `.active-mode`
- CSS class naming: BEM-like, `component-name__element` format (e.g. `players-grid__item`)
- Each page/component has its own CSS file, shared global styles live in `global.css`
- Prefer `cubic-bezier` for animations, `transition` durations between 0.3–0.5s

## React Patterns
- Keep state at the nearest common ancestor (lifting state up) — use Context only when the tree is genuinely deep
- Do not manipulate child state from parent via `useImperativeHandle` + `ref`
- Extract a custom hook (like `usePlayerForm`) only when the same logic is reused in multiple places or the page grows too large
- Control Bootstrap components with the `show` prop instead of conditional mounting so animations work

## TypeScript
- Type definitions are kept in sync between `openteur/src/services/api/types.ts` and `server/models/Player.ts`
- When adding a new Player field, update both sides together
