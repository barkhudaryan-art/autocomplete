# React Component Rules

Apply when adding, editing, or reviewing component/container files.

## File Structure
- Exactly **one** main exported component/container per file.
- Helper components: internal, stateless, **<30 lines**. Larger → extract to `components/MetadataNode.js`.
- Helper functions: **<20 lines**, local-only, not exported. If combined helpers >30 lines or contain complex logic (e.g. tree traversal) → extract to `camelCase.helper.js` or `camelCase.bl.js`.
- Any file >150 lines = maintainability violation; split it.

## Imports
Separate groups with one blank line. Order:
1. React, ReactDOM, styles
2. Components / Containers (any path)
3. Redux: `useDispatch`, `useSelector`, reducers, selectors
4. Utilities: helpers, hooks, hocs, configs, context
5. Everything else

## Declaration
- Do not destructure props in the signature.
- Always: `function ComponentName( props ) {`, then destructure on the next line.

## Body Order (strict, one blank line between groups)
1. Props extraction
2. Redux: `useDispatch` + selectors
3. Context hooks
4. `useState`
5. `useRef`
6. Dependency variables (used by hooks/effects below)
7. Dependency functions for effects
8. Custom hooks
9. `useEffect` (mount first)
10. Function declarations (handlers, render helpers)
11. Variable declarations (derived state, mapped arrays)
12. `return`

Never declare below first use.

## JSX & Props
- No inline declarations or long chains in JSX props.
- No wrappers like `onClick={( e ) => clickHandler( e )}` — pass the reference: `onClick={clickHandler}`.
- No `headers={headers.filter(...).map(...)}` — assign to `appliedHeaders` above the return.
