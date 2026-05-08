# Autocomplete — Senior Frontend Learning Project

A deliberately scoped learning project: autocomplete dropdown component

## Skills targeted

- TypeScript (strict mode, generics, narrowing, utility types)
- Tailwind CSS (utility-first styling, design tokens, responsive)
- Accessibility — WAI-ARIA Combobox 1.2 pattern, keyboard nav, screen-reader testing
- TanStack Query (caching, staleness, cancellation, error/loading UX)
- React Hook Form + Zod (form integration, schema validation)
- Performance (memoization, virtualization, profiling)
- Testing (Vitest + Testing Library + user-event, behavior-first)
- React patterns (custom hooks, controlled vs uncontrolled, compound components)

## Roadmap

Each phase ends with a working, committed checkpoint. Don't skip ahead — earlier phases set up the ground each later phase stands on.

### Phase 1 — Foundation
- [ ] Migrate JS/JSX → TypeScript (strict mode)
- [ ] Three-file `tsconfig` split (`tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`)
- [ ] Swap to `typescript-eslint` parser for `.ts`/`.tsx`
- [ ] Add `npm run typecheck` script
- [ ] Install Tailwind CSS, retire SCSS
- [ ] Define a tiny token layer (colors, radii, spacing scale) in Tailwind config

### Phase 2 — Component skeleton
- [ ] Static `<Autocomplete>` UI: input, list container, option rows
- [ ] Static loading / empty / no-results / error states
- [ ] Decide controlled vs uncontrolled API; document the choice
- [ ] Storybook-style demo page (or a plain demo route)

### Phase 3 — Behavior
- [ ] `useDebounce` hook (and understand why debounce vs throttle)
- [ ] `useClickOutside` hook (pointer + focus, not just `mousedown`)
- [ ] `useKeyboardNav` hook for arrow / Home / End / Enter / Escape
- [ ] Open / close, highlight index, select, clear
- [ ] Reset highlight when query changes

### Phase 4 — Data layer
- [ ] TanStack Query: `useQuery` with the debounced query as part of the key
- [ ] `staleTime`, `gcTime`, `placeholderData` — understand each
- [ ] Cancel stale requests; handle race conditions
- [ ] Wire loading / error / empty states to real query state
- [ ] Pick a free public API to query (e.g. PokéAPI, GitHub users, REST Countries)

### Phase 5 — Accessibility (the hard one)
- [ ] Roles: `combobox`, `listbox`, `option` per WAI-ARIA APG 1.2
- [ ] `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete`
- [ ] Full keyboard support: ↑ ↓ Home End Enter Escape Tab PageUp/Down
- [ ] `aria-live` region announcing result counts
- [ ] Focus management — input keeps focus, options are virtually focused
- [ ] Test with NVDA on Windows; document findings
- [ ] Run axe-core, fix every violation

### Phase 6 — Performance
- [ ] Profile with React DevTools — identify wasted renders
- [ ] Apply `useMemo` / `useCallback` / `React.memo` where they actually help
- [ ] Virtualize long lists with `@tanstack/react-virtual`
- [ ] Compare bundle size before/after with `rollup-plugin-visualizer`

### Phase 7 — Forms
- [ ] Integrate with React Hook Form via `Controller`
- [ ] Zod schema for the form
- [ ] `zodResolver`; surface field errors next to the input
- [ ] Submit handler, async validation example

### Phase 8 — Quality
- [ ] Vitest + Testing Library + `user-event` set up
- [ ] Behavior tests: keyboard nav, selection, clear, error state
- [ ] Accessibility tests with `jest-axe` (or `vitest-axe`)
- [ ] Edge cases: empty string, whitespace, unicode, very long lists
- [ ] Error boundary around the component

## Working notes

Track open questions, decisions, and links to docs as you go — keep them in this section so future-you understands past-you.

### Decisions log

_(empty — fill as you make choices)_

### Open questions

_(empty — fill as you hit them)_

## Daily log

Short, dated entries — what got done, what blocked you. One or two lines is enough.

_(empty — start once Phase 1 begins)_
