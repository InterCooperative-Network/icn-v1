# Contributing to ICN v1

- Use small, focused PRs with clear titles and descriptions.
- Keep services isolated; share contracts via `contracts/*` only.
- Follow language norms:
  - Rust: `cargo fmt`/`clippy` when added; prefer explicit types and tests.
  - Python: pydantic models, FastAPI style; add pytest when adding logic.
  - TypeScript: strict TS, small modules, Fastify; add zod where practical.
- CI must pass (CI, CI Smoke, CI Lint). Add or update tests when changing logic.
- Security: never commit secrets; use env vars; avoid PII in logs.
