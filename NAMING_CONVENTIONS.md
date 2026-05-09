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

### React components and containers: PascalCase.tsx or PascalCase.tsx

file name and exported component names should match

```text
FilterButton.tsx
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
usePortalPosition.ts
useVirtualList.ts
useOnOutsideClick.ts
```

### Utilities

**camelCase.{utility name}.ts**:

```text
global.helper.ts
sport.mapper.ts
filter.constant.ts
region.controller.ts
competition.selector.ts
withPortal.hoc.ts
portal.context.ts
portal.provider.ts
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
something.helper.test.ts
FilterButton.test.tsx
FilterButton.generative.test.tsx
```

Avoid names like:

```text
index.test.ts
```

### Stories, fixtures and examples

```text
FilterButton.stories.tsx
FilterButton.fixture.tsx
FilterButton.autofix.tsx
```

## Folder Structure Rules

### Single-file modules

If a module has only one file and no meaningful sibling files, use a single explicit file instead of a folder.

Preferred:

```text
components/
	Loader.ts
```

### Multi-file modules

If a module has styles, tests, helpers or subcomponents, use a folder.

Preferred:

```text
components/
	filter-button/
		index.ts
		FilterButton.ts
		FilterButton.module.scss
		FilterButton.test.ts
```

## `index.ts` Usage Rules

Used only for:
- package/folder entrypoint
- grouped exports
- barrel files
- public API aggregation

Preferred:
```text
filter-button/
	index.ts
	FilterButton.tsx
	FilterButton.module.scss
	FilterButton.test.tsx
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
	index.ts
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
| Component        | kebab-case                  | PascalCase.tsx                  |
| Container        | kebab-case                  | PascalCase.tsx                  |
| Hook             | grouped folder or direct    | useSomething.ts                 |
| SDK              | grouped folder or direct    | camelCase.sdk.ts                |
| Controller       | grouped folder or direct    | camelCase.controller.ts         |
| BL               | grouped folder or direct    | camelCase.bl.ts                 |
| Enum             | grouped folder or direct    | camelCase.enum.ts               |
| Helper           | grouped folder or direct    | camelCase.helper.ts             |
| Manager          | grouped folder or direct    | camelCase.manager.ts            |
| Mapper           | grouped folder or direct    | camelCase.mapper.ts             |
| Service          | grouped folder or direct    | camelCase.service.ts            |
| Context          | grouped folder or direct    | camelCase.context.ts            |
| Provider         | grouped folder or direct    | camelCase.provider.ts           |
| Constant         | grouped folder or direct    | camelCase.constant.ts           |
| HOC              | grouped folder or direct    | camelCase.hoc.ts                |
| store/action-reg | grouped folder or direct    | camelCase.actionRegistration.ts |
| store/middleware | grouped folder or direct    | camelCase.middleware.ts         |
| store/reducer    | grouped folder or direct    | camelCase.reducer.ts            |
| store/selector   | grouped folder or direct    | camelCase.selector.ts           |
| Style            | same folder as owner        | OwnerName.module.scss           |
| Test             | same folder as owner        | OwnerName.test.tsx              |
| Generative test  | same folder as owner        | OwnerName.generative.test.tsx   |
| Barrel           | folder root                 | index.ts                        |
| Package entry    | package root or `src/` root | index.ts                        |

## Preferred Patterns

### Complex container

```text
portal-container/
	index.ts
	PortalContainer.tsx
	PortalContainer.module.scss
	helpers/
		portalPosition.helper.ts
	hooks/
		usePortalPosition.ts
	__tests__/
		PortalContainer.test.tsx
		PortalContainer.generative.test.tsx
```

## Edge Cases

### Private subcomponents

Private subcomponents should still use explicit filenames:

```text
pagination/
	Pagination.tsx
	components/
		PageButton.tsx
		PageSizeSelect.tsx
```

### Modifier and helper files

Discouraged:
```text
FilterButtonComponent.ts
FilterButtonStyles.module.scss
```