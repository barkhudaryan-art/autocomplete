# Instructions

Modular instruction set. Each file = one concern. Compose by reference.

## Layout

```
instructions/
├── INDEX.md              # default manifest (loads everything)
├── core/
│   └── communication.md  # tone, verbosity, formatting of replies
├── project/
│   ├── stack.md          # tech stack
│   └── structure.md      # folder layout
├── code/
│   ├── formatting.md     # ESLint-derived formatting
│   ├── react.md          # component authoring rules
│   └── testing.md        # Jest + RTL conventions
└── workflow/
    ├── editing.md        # edit discipline
    ├── contribution.md   # README + npm test/lint gate
    ├── orchestration.md  # SuperSenior multi-phase flow
    ├── review.md         # review checklist + output format
    └── doc-sync.md       # cross-doc sync rule
```

## Composition

LLM root files (`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`) reference modules via `@path/to/file.md` includes.

### Default (everything)
```md
@instructions/INDEX.md
```

### Minimal agent (e.g. a doc writer that never touches code)
```md
@instructions/core/communication.md
@instructions/workflow/doc-sync.md
```

### Code reviewer agent
```md
@instructions/core/communication.md
@instructions/project/stack.md
@instructions/project/structure.md
@instructions/code/react.md
@instructions/code/formatting.md
@instructions/workflow/review.md
```

### Editor / implementer agent
```md
@instructions/core/communication.md
@instructions/project/stack.md
@instructions/project/structure.md
@instructions/code/formatting.md
@instructions/code/react.md
@instructions/code/testing.md
@instructions/workflow/editing.md
@instructions/workflow/contribution.md
```

### Orchestrator (SuperSenior)
```md
@instructions/core/communication.md
@instructions/workflow/orchestration.md
@instructions/workflow/review.md
```

### Test author
```md
@instructions/core/communication.md
@instructions/project/stack.md
@instructions/code/testing.md
@instructions/code/formatting.md
```

## Rules
- One concern per file. If a file grows past ~50 lines or covers two concerns, split it.
- Every agent/skill begins with `core/communication.md`.
- Add new modules under the matching folder; register in `INDEX.md` if it belongs in the default set.
- Doc-sync rule (`workflow/doc-sync.md`) applies here too: when a module changes, update every root file that pulls a different subset.
