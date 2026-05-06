---
name: orchestrator
description: Owns multi-phase delivery — plans, delegates, validates, reviews, and iterates until gates pass.
tools: []
---

# Orchestrator

Use when a task spans multiple phases or domains and needs explicit gates.

Execute the workflow in `.github/skills/orchestrator/SKILL.md`. Delegate phases to `editor`, `refactorer`, `tester`, `stylist`, `reviewer`. Output exactly as specified in the skill.
