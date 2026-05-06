# Naming and Symbol Conventions

This document defines global naming conventions for files, folders, modules, and symbols across projects.

The goal is to optimize for:

- IDE tab readability
- filename searchability
- stable import paths
- clear public APIs
- easier refactoring
- predictable colocation of tests, styles and helpers
- consistency across packages

## Directory Naming - kebab-case

```text
filter-button/
portal-container/
date-picker/
row-action/
```

## File Naming by Type

### React components and containers: PascalCase.jsx or PascalCase.tsx

file name and exported component names should match

```text
FilterButton.jsx
PortalContainer.tsx
```

```javascript
function FilterButton( props ) {
	return null;
}

export default React.memo( FilterButton );
```

### Hooks

**camelCase** with a `use` prefix:
- the file name should match the exported hook name

```text
usePortalPosition.js
useVirtualList.js
useOnOutsideClick.js
```

### Utilities

**camelCase.{utility name}.js**:

```text
global.helper.js
sport.mapper.js
filter.constant.js
region.controller.js
competition.selector.js
withPortal.hoc.js
portal.context.js
portal.provider.js
```

If the helper is a singleton or module object, the file name should still reflect the exported symbol.

### Styles

Match the owning component or module whenever practical:

```text
FilterButton.module.scss
Pagination.module.scss
```

### Tests

Match the owning module name:

```text
something.helper.test.js
FilterButton.test.jsx
FilterButton.generative.test.jsx
```

Avoid names like:

```text
index.test.js
```

### Stories, fixtures and examples

```text
FilterButton.stories.jsx
FilterButton.fixture.jsx
FilterButton.autofix.jsx
```

## Folder Structure Rules

### Single-file modules

If a module has only one file and no meaningful sibling files, use a single explicit file instead of a folder.

Preferred:

```text
components/
	Loader.js
```

### Multi-file modules

If a module has styles, tests, helpers or subcomponents, use a folder.

Preferred:

```text
components/
	filter-button/
		index.js
		FilterButton.js
		FilterButton.module.scss
		FilterButton.test.js
```

## `index.js` Usage Rules

Used only for:
- package/folder entrypoint
- grouped exports
- barrel files
- public API aggregation

Preferred:
```text
filter-button/
	index.js
	FilterButton.jsx
	FilterButton.module.scss
	FilterButton.test.jsx
```
```text
portal-container/
	index.ts
	PortalContainer.tsx
	PortalContainer.module.scss
	PortalContainer.test.tsx
```

Discouraged:
```text
filter-button/
	index.js
```

Example folder barrel:

```javascript
export { default } from './FilterButton';
export * from './FilterButton';
```

## Symbols

- Components: `PascalCase`.
- Hooks: `use` prefix in `camelCase` (`usePermissions`, `usePartnerFilters`).
- Reducers and actions: descriptive `camelCase` aligned with domain language.
- Selectors: `select` prefix (`selectUsers`, `selectCurrentPartner`).
- Constants: `UPPER_SNAKE_CASE`.
- Boolean fields and flags: `is`, `has`, `can`, `should` prefixes.

## Domain Language

- Use business terms consistently across UI labels, state keys, and API mapping fields.
- Avoid ambiguous abbreviations unless they are established domain terms.
- Prefer intent-revealing names over short names.

## Anti-Patterns

- Generic names without context (`data`, `item`, `value`) outside narrow local scopes.
- Different names for the same domain concept across files.
- Misleading boolean names that do not read as true or false statements.

## Naming Summary

| Type             | Directory                   | File                            |
|------------------|-----------------------------|---------------------------------|
| Component        | kebab-case                  | PascalCase.jsx                  |
| Container        | kebab-case                  | PascalCase.jsx                  |
| Hook             | grouped folder or direct    | useSomething.js                 |
| SDK              | grouped folder or direct    | camelCase.sdk.js                |
| Controller       | grouped folder or direct    | camelCase.controller.js         |
| BL               | grouped folder or direct    | camelCase.bl.js                 |
| Enum             | grouped folder or direct    | camelCase.enum.js               |
| Helper           | grouped folder or direct    | camelCase.helper.js             |
| Manager          | grouped folder or direct    | camelCase.manager.js            |
| Mapper           | grouped folder or direct    | camelCase.mapper.js             |
| Service          | grouped folder or direct    | camelCase.service.js            |
| Context          | grouped folder or direct    | camelCase.context.js            |
| Provider         | grouped folder or direct    | camelCase.provider.js           |
| Constant         | grouped folder or direct    | camelCase.constant.js           |
| HOC              | grouped folder or direct    | camelCase.hoc.js                |
| store/action-reg | grouped folder or direct    | camelCase.actionRegistration.js |
| store/middleware | grouped folder or direct    | camelCase.middleware.js         |
| store/reducer    | grouped folder or direct    | camelCase.reducer.js            |
| store/selector   | grouped folder or direct    | camelCase.selector.js           |
| Style            | same folder as owner        | OwnerName.module.scss           |
| Test             | same folder as owner        | OwnerName.test.jsx              |
| Generative test  | same folder as owner        | OwnerName.generative.test.jsx   |
| Barrel           | folder root                 | index.js                        |
| Package entry    | package root or `src/` root | index.js                        |

## Preferred Patterns

### Complex container

```text
portal-container/
	index.js
	PortalContainer.jsx
	PortalContainer.module.scss
	helpers/
		portalPosition.helper.js
	hooks/
		usePortalPosition.js
	__tests__/
		PortalContainer.test.jsx
		PortalContainer.generative.test.jsx
```

## Edge Cases

### Private subcomponents

Private subcomponents should still use explicit filenames:

```text
pagination/
	Pagination.jsx
	components/
		PageButton.jsx
		PageSizeSelect.jsx
```

### Modifier and helper files

Discouraged:
```text
FilterButtonComponent.js
FilterButtonStyles.module.scss
```