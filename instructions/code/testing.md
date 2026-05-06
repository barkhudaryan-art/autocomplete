# Testing

- Tests live in `__tests__/` next to the component.
- Two types:
  - `Component.test.js` — behavioral
  - `Component.generative.test.js` — matrix
- Use `renderWithProviders` from package `test-utils.js`.
- Use `generateCombinations` for matrix tests.
- Mock external libs (e.g. `react-day-picker`).
- Dates: `globalHelper.formatDate()` → `YYYY-MM-DD`.
