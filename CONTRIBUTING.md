# Contributing to ICN Platform

We welcome contributions aligned with cooperative principles and the PoC specification.

## Workflow
- Branch naming: `feature/`, `fix/`, `chore/`
- Conventional commits required
- Open a PR with the template filled (threat model delta, API diffs, migrations)
- All checks must pass (lint, unit, integration, e2e, scans)

## Change Control
Spec changes require a governance-neutral Technical RFC approved by maintainers.

See `docs/contribution-workflow.md` and `docs/implementation-guide.md` for details.

# Contributing to ICN v1

- Use small, focused PRs with clear titles and descriptions.
- Keep services isolated; share contracts via `contracts/*` only.
- Follow language norms:
  - Rust: `cargo fmt`/`clippy` when added; prefer explicit types and tests.
  - Python: pydantic models, FastAPI style; add pytest when adding logic.
  - TypeScript: strict TS, small modules, Fastify; add zod where practical.
- CI must pass (CI, CI Smoke, CI Lint). Add or update tests when changing logic.
- Security: never commit secrets; use env vars; avoid PII in logs.
