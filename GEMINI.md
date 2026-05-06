# Entry Point

## Always
Follow `instructions/core/communication.md` for tone and verbosity. Nothing else is autoloaded.

## Pick ONE Agent

Match the task to a single agent. Do not chain unrelated agents.

| Task                                                       | Agent          |
|------------------------------------------------------------|----------------|
| Any file change (source, tests, config, docs tied to code) | `editor`       |
| Review a file or small set of files                        | `reviewer`     |
| Split oversized file / extract logic                       | `refactorer`   |
| Write or review tests                                      | `tester`       |
| Write or review styles                                     | `stylist`      |
| Multi-phase task spanning ≥2 domains                       | `orchestrator` |

Agents live in `.gemini/agents/`. Each points to its skill workflow in `.gemini/skills/<name>/SKILL.md`.

## Project Rules
Project-specific rules (stack, structure, formatting, framework conventions, naming, workflow) live in `instructions/`. The active skill loads only the modules it needs from `instructions/INDEX.md`.

## Direct Q&A
For a direct question that requires no agent (e.g. "what does X do?"), answer concretely per `instructions/core/communication.md`. Do not load skills or project rules unless the answer requires them.
