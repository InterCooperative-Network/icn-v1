# InterCooperative Network (ICN) Platform — Substrate

Democratic coordination infrastructure for autonomous cooperatives. This repository hosts the PoC and platform substrate enabling identity federation, event-sourced coordination, and democratic governance across cooperating organizations.

## Key Documents
- `docs/poc-objectives.md` — Objectives, scope, milestones, success metrics
- `docs/governance-process.md` — Governance models and decision process
- `docs/implementation-guide.md` — Complete implementation guide for AI agents

## Quick Start
1. Ensure Docker and Docker Compose are installed
2. Copy and edit environment config in `config/environments/development.yml`
3. Start dev stack: `make dev`

## Monorepo Layout
See the Implementation Guide for the canonical repository structure and service responsibilities.

## License
AGPL-3.0 — see `LICENSE` for details.

# ICN (v1)
A thin, federated coordination substrate for cooperatives.

## Services
- **event-store** (Rust): CQRS/event-sourced kernel with strict types.
- **governance-engine** (Python/FastAPI): democratic workflows.
- **api-gateway** (TypeScript/Fastify): public API + integration edge.
- **site**: static landing page (GitHub Pages).

## Dev quickstart
See `infra/docker-compose.dev.yml` and service READMEs.
