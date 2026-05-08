# Lint

Centralized lint workspace.

## Structure

```text
lint/
  README.md
  eslint/
    eslint.config.mjs      # main ESLint flat config
    ignores.mjs            # shared ESLint ignore patterns
    eslint-test.js         # JSX rule playground / manual checks
    fixtures/              # ESLint custom-rule fixtures and autofix samples
    plugins/               # custom ESLint rules
```

## Installation

Install lint dependencies from the repo root:

```bash
npm i -D @babel/core@7.27.1 @babel/eslint-parser@7.28.6 @eslint/js@9.39.4 eslint@9.39.4 eslint-plugin-import@2.32.0 eslint-plugin-react@7.37.5 eslint-plugin-react-hooks@5.2.0 globals@15.15.0 --legacy-peer-deps
```

### WebStorm setup

#### JS:

1. Open WebStorm settings
2. Go to `Languages & Frameworks > JavaScript > Code Quality Tools > ESLint`
3. Check the `Automatic ESLint configuration` checkbox
4. Run for files: `**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts,html,vue}`

### Hot Key (Optional)

1. Go to `Keymap`
2. Type "lint" in search bar
3. Select `Fix ESLint Problems`
4. Set the desired hotkey, both keys can be the same for ESLint (e.g., `Ctrl + Alt + L`)

## Usage

Run from the repo root.

### JavaScript / JSX

```bash
npm run lint
npm run lint:fix
```

Direct config usage:

```bash
npx eslint --config lint/eslint/eslint.config.mjs "packages/**/src/**/*.js"
npx eslint --config lint/eslint/eslint.config.mjs lint/eslint/eslint-test.js
```

### CSS / SCSS

```bash
npm run lint:styles
npm run lint:styles:fix
```

## Root shims

The root `eslint.config.mjs` stay in place as thin shims so editor auto-discovery continues to work.

## ESLint custom rules

Custom rules live in `lint/eslint/plugins/`.

Current custom rule set includes:
- `chop-overlong-lines`
- `closing-bracket-alignment`
- `jsx-formatting`
- `no-blank-lines-at-boundaries`
- `no-inline-tabs`
- `ternary-formatting`

### Important JS / JSX formatting rules

#### General JS rules
- Tabs for indentation
- Single quotes
- Semicolons always
- Space in parens for non-empty pairs: `if ( value )`
- Empty call parens must not contain spaces: `fn()` (not `fn( )`)
- Space in object braces for non-empty objects: `{ key: value }`
- Empty object braces must not contain spaces: `{}` (not `{ }`)
- No space in array brackets: `[1, 2, 3]`
- 1TBS braces
- No trailing spaces
- No trailing commas
- Max line length target: 150
- Two blank lines max between statements
- No blank lines at boundaries (start/end of blocks, objects, arrays, parens)
- No one-liner blocks (e.g., `if (x) doSomething();` is not allowed)
- Multiline arrays with 2+ elements must place `[` and `]` on their own lines, and each element must be on its own line
- Single-item arrays may be either single-line (`[value]`) or multiline (`[\n\tvalue\n]`) when alignment is correct
- Multiline function-call closing-paren alignment is context-sensitive:
  - if the first argument starts on a new line, closing `)` must be on its own line
  - if the first argument stays on the opening `(` line, closing `)` stays on the argument line
- If single-line expressions are correct and fits in max line length range (e.g., `const x = [1, 2, 3, 4]`), should not force newlines
- Ternary expressions can be single-line if one condition and both branches are simple, but must be multiline if either branch contains a JSX element, if the expression is too long or branch contains nested ternary
- Opening and closing parens, braces and brackets must be aligned (e.g., if opening looks like this: `[({`, closing must look like this:) `})]`), except for cases when expressions/arguments are also broken down to be multiline (e.g., `call(\n  {
		key: ternary,
		key2: ternary2
	}, [
		ternary,
		ternary2
	]\n)` is correct, even though closing paren is not aligned with opening and inner brackets)

#### JSX rules

- Elements are allowed to be single-line if:
  - Children expressions are also single-line and simple (e.g., string literals, simple variables, simple function calls)
  - Children expression is a simple, non-nested ternary, without JSX elements in any of branches
  - Has no children elements
- Multiline JSX elements must have closing tag on its own line, aligned with the opening tag
- Self-closing JSX tags must not contain a space before `/>`
- Attributes on opening JSX tag can be on the same line if they fit in max line length, otherwise they break into multiple lines, each attribute must be on its own line, their respective opening and closing tags (e.g., `<Component` and `/>` or `>`) must be on their own lines, aligned with each other
- Children with expressions inside `{}` can be single-line if the expression is simple (e.g., string literals, simple variables, simple function calls) and the resulting line fits in max line length, otherwise they must be multiline with opening and closing `{` and `}` on their own lines, aligned with each other
- Ternary expressions inside JSX can be single-line if they are simple (no nested ternaries, no JSX elements in branches) and the resulting line fits in max line length, otherwise they must be multiline with the `?` and `:` operators at the beginning of their respective lines, aligned with each other
- Conditional rendering, even if chained (multiple `&&` or `||`), can be single-line if it's a simple expression or literals, otherwise it must be multiline with the `&&` / `||` operator at the end of the line, aligned with the start of the JSX element they're rendering
- Arrow callbacks may return single-line JSX when simple and within max length; multiline JSX returns must follow multiline formatting/alignment rules.
  - If the value is inside parentheses, they also must be aligned with each other
- JSX elements, Fragments and all elements inside ternaries or other expressions follow same rules

## ESLint playground and fixtures

Use `lint/eslint/eslint-test.js` for manual rule experimentation.

Use `lint/eslint/fixtures/` for stable regression samples:
- `*.fixture.js` for inputs / valid examples
- `*.autofix.js` for expected autofix outputs

## Notes for maintenance

When editing lint rules:
1. update the rule in `lint/eslint/plugins/`
2. verify against the playground / fixtures
3. run both root lint commands
4. keep the root shims minimal

