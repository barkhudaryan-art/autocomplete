# File Review

For any file review, check in this order:

1. **Bugs / API misuse** — prop mismatches, stale closures, missing deps.
2. **Structure & size** — helper fns >20 lines, subcomponents >30 lines, file >150 lines.
3. **Body order** — strict 12-step order from `code/react.md`. Flag hooks after variables, `useEffect` right before `return`.
4. **ESLint & declaration** — formatting + no use-before-declare.
5. **Naming & maintainability** — `NAMING_CONVENTIONS.md`; flag mixed responsibilities.

## Sources of Truth
- `core/communication.md`, `code/*`, `workflow/*`
- `lint/eslint/eslint.config.mjs`
- `NAMING_CONVENTIONS.md`

## Output Format
Sort by severity: **Critical → High → Medium → Low**.

Per finding:
- file path + line/symbol
- what is wrong
- why it matters
- minimal fix

If clean: `No actionable findings.`

Include open questions / residual risks only when they affect correctness.
