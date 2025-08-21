## ICN Contribution Workflow and Change Control (PoC)

### Purpose
- Provide a clear, lightweight workflow for contributors (humans and AI agents) that enforces quality, security, and governance alignment without slowing down PoC delivery.

### Branching and Commits
- Branch naming: `feature/`, `fix/`, `chore/`
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`, `build:`, `ci:`
- Keep commits small and logically grouped; include context in body for AI reviewers

### Pull Requests
- Required PR template includes:
  - Threat model delta (what changes in attack surface?)
  - API diffs (OpenAPI/GraphQL/gRPC changes) with generated artifacts
  - Migration diffs (DDL up/down), schema diff snapshot
  - Observability notes (new metrics/traces/logs)
- Code owners must review for their areas: event store, governance, api, infra
- Automated reviewers: schema bot, security bot, performance bot

### Required Checks (CI)
- Lint, unit, integration, e2e, container build
- SBOM generation, Trivy scan
- OpenAPI diff approval; AsyncAPI schema validation
- Migration up and down tested
- License header check

### Change Control and RFCs
- The foundational PoC spec is the single source of truth
- Any change to objectives, scope, or interfaces requires a governance-neutral Technical RFC (TRFC)
- TRFC format:
  - Context and motivation
  - Proposal (API/Schema/Behavior)
  - Security/Privacy impact
  - Backwards compatibility
  - Rollout and migration plan
  - Metrics and acceptance criteria
- TRFC approval: maintainers sign-off; if governance-impacting, open a proposal via governance process

### Development Environment
- Use Docker Compose and `make` targets:
  - `make setup` — bootstrap env, run migrations, seed data
  - `make dev` — hot-reload services
  - `make test` — run unit and integration suites

### Coding Standards
- Language mapping:
  - Rust — event store core and validation; gRPC service
  - Python — governance engine and analytics
  - TypeScript — API gateway and web frontend
- Event sourcing invariants: smallest monetary unit; idempotency keys; cross-coop events require governance proofs
- Style: readable, explicit types, guard clauses, meaningful names; avoid deep nesting

### Security and Compliance
- Secrets via Vault; TLS everywhere
- JWT short lifetimes with refresh; RBAC enforced; RLS for coop-scoped reads
- Supply chain: signed images, SBOM published, dependency pinning
- Backups: daily Postgres and Keycloak exports; monthly restore drills

### Observability
- OpenTelemetry tracing; Jaeger
- Prometheus metrics: event throughput, governance latency, quorum and rejection rates
- Loki structured JSON logs; alert routes for deadlocks, Kafka lag, 5xx rates

### Testing Strategy
- Unit (≥80% key modules, ≥95% critical paths)
- Contract tests (Pact) for REST/gRPC
- Integration via docker-compose with seeded data
- E2E headless: propose → vote → execute; resource booking; mutual aid
- Governance sims: Monte Carlo for quorum failures

### Contribution from AI Agents
- Follow the same workflow; include reasoning summary in PR description
- Respect TRFC process for spec-level changes; do not bypass governance
- Prefer small, verifiable increments with measurable acceptance criteria


