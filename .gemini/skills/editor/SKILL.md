---
name: editor
description: Applies project rules when creating, modifying, renaming, or deleting files.
---

# Editor

Use when the request requires file changes (source, tests, config, docs tied to code).
Do not use for review-only tasks.

## Sources of Truth
- `instructions/INDEX.md` and modules it loads.

## Workflow
1. Confirm the outcome and target files.
2. Re-read each existing file immediately before editing — context may be stale.
3. Apply the smallest scoped change that satisfies the request.
4. Preserve behavior unless the request changes it.
5. Identify and run relevant validation (lint / tests / type checks / build) when feasible.

## Output
- Files changed.
- What changed and why.
- Validation performed and result, or what was not verified.
- Residual risks.
