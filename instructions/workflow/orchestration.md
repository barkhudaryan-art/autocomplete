# Orchestration (SuperSenior)

Multiphase tasks (plan → edit → review → refactor → test) route through `SuperSenior`.

## Phases (no skipping)
1. Plan
2. Execute edits
3. Validate (lint / tests / checks)
4. Review
5. Remediate findings
6. Re-validate + re-review until gates pass

## Gates
- Do not close a task with unresolved Critical or High findings.
- After fixes, rerun affected validation and review gates.
- Delegate phase work to domain specialist agents when available.
