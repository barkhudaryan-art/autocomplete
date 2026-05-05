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

## Core Rule

Implementation files should have explicit names.

`index.js` should be used only for:

- package entrypoints
- folder entrypoints
- barrel files
- public API aggregation

So this is preferred:

```text
filter-button/
	index.js
	FilterButton.js
	FilterButton.module.scss
	FilterButton.test.js
```

And this is discouraged for implementation:

```text
filter-button/
	index.js
```

## Directory Naming

Use **kebab-case** for directories:

```text
filter-button/
portal-container/
date-picker/
row-action/
```

This keeps paths readable and consistent across platforms and tooling.

## File Naming by Type

### React components and containers

Use **PascalCase.js** for implementation files:

```text
FilterButton.js
PortalContainer.js
Pagination.js
EntitiesImport.js
```

Rules:

- the file name should match the exported component name
- if the component is the main module in a folder, keep a local `index.js` barrel next to it

Example:

```javascript
function FilterButton( props ) {
	return null;
}

export default React.memo( FilterButton );
```

### Hooks

Use **camelCase** with a `use` prefix:

```text
usePortalPosition.js
useVirtualList.js
useOnOutsideClick.js
```

Rules:

- hooks must start with `use`
- the file name should match the exported hook name

### Helpers and utilities

Use **camelCase.{utility name}.js**:

```text
global.helper.js
sport.mapper.js
filter.constant.js
region.controller.js
competition.selector.js
```

If the helper is a singleton or module object, the file name should still reflect the exported symbol.

### Context

Use names that match the exported React context or provider:

```text
PortalContext.js
PortalProvider.js
usePortalContext.js
```

### HOCs

Use descriptive **camelCase** names:

```text
withPortal.js
withPagination.js
```

### Constants

For grouped modules, `index.js` is allowed:

```text
constants/index.js
```

If the constants become too large, split them into explicit files:

```text
constants/dataTitles.constant.js
constants/portalPositions.constant.js
```

### Styles

Styles should match the owning component or module whenever practical:

```text
FilterButton.module.scss
Pagination.module.scss
```

### Tests

Tests should match the owning module name:

```text
FilterButton.test.js
FilterButton.generative.test.js
Pagination.test.js
```

Avoid names like:

```text
index.test.js
```

### Stories, fixtures and examples

Use the owning module name as the base:

```text
FilterButton.stories.js
FilterButton.fixture.js
FilterButton.autofix.js
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

### Allowed

Use `index.js` for:

1. folder barrel files
2. package entrypoints
3. grouped exports
4. public API boundaries

Example folder barrel:

```javascript
export { default } from './FilterButton';
export * from './FilterButton';
```

### Discouraged

Do not use `index.js` as the only implementation file for components and containers when the file is the real implementation.

Why:

- poor IDE tab readability
- low filename search value
- noisier grep and changed-file lists
- less readable stack traces
- harder refactoring

## Import Rules

### External imports

Consumers should usually import from the folder path:

```javascript
import FilterButton from './filter-button';
```

This keeps imports short and stable.

### Internal imports

Inside a folder or during refactors, explicit file imports are acceptable:

```javascript
import FilterButton from './FilterButton';
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
| Component        | kebab-case                  | PascalCase.js                   |
| Container        | kebab-case                  | PascalCase.js                   |
| Hook             | grouped folder or direct    | useSomething.js                 |
| SDK              | grouped folder or direct    | camelCase.sdk.js                |
| Controller       | grouped folder or direct    | camelCase.controller.js         |
| BL               | grouped folder or direct    | camelCase.bl.js                 |
| Enum             | grouped folder or direct    | camelCase.enum.js               |
| Helper           | grouped folder or direct    | camelCase.helper.js             |
| Manager          | grouped folder or direct    | camelCase.manager.js            |
| Mapper           | grouped folder or direct    | camelCase.mapper.js             |
| Service          | grouped folder or direct    | camelCase.service.js            |
| Context          | grouped folder or direct    | PascalCase.context.js           |
| Constant         | grouped folder or direct    | camelCase.constant.js           |
| HOC              | grouped folder or direct    | withSomething.hoc.js            |
| store/action-reg | grouped folder or direct    | camelCase.actionRegistration.js |
| store/middleware | grouped folder or direct    | camelCase.middleware.js         |
| store/reducer    | grouped folder or direct    | camelCase.reducer.js            |
| store/selector   | grouped folder or direct    | camelCase.selector.js           |
| Style            | same folder as owner        | OwnerName.module.scss           |
| Test             | same folder as owner        | OwnerName.test.js               |
| Generative test  | same folder as owner        | OwnerName.generative.test.js    |
| Barrel           | folder root                 | index.js                        |
| Package entry    | package root or `src/` root | index.js                        |

## Preferred Patterns

### Component with styles and tests

```text
filter-button/
	index.js
	FilterButton.js
	FilterButton.module.scss
	FilterButton.test.js
```

### Complex container

```text
portal-container/
	index.js
	PortalContainer.js
	PortalContainer.module.scss
	helpers/
		portalPositionHelper.js
	hooks/
		usePortalPosition.js
	__tests__/
		PortalContainer.test.js
		PortalContainer.generative.test.js
```

### Utilities/Modules collection

```text
hooks/
	useList.js
	usePaging.js
	useVirtualList.js
	index.js
helpers/
	global.helper.js
	filter.helper.js
	list.helper.js
	index.js
```

## Edge Cases

### Private subcomponents

Private subcomponents should still use explicit filenames:

```text
pagination/
	Pagination.js
	components/
		PageButton.js
		PageSizeSelect.js
```

### Modifier and helper files

Avoid redundant names like:

```text
FilterButtonComponent.js
FilterButtonStyles.module.scss
```

Prefer:

```text
FilterButton.js
FilterButton.module.scss
```

## Repo Policy Statement

The project standard is:

> Use explicit names for implementation files and reserve `index.js` for entrypoints and barrel files.

This gives the project:

- better IDE tab readability
- better filename search
- clearer diffs and stack traces
- cleaner public import paths
- safer gradual refactoring

