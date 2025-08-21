## InterCooperative Network (ICN) Proof of Concept: Objectives and Scope

### Audience
- Core developers, AI agents, and pilot cooperatives participating in the PoC

### Purpose
- Implement a thin coordination layer that enables autonomous cooperatives to trade, share resources, and decide together with auditability and democratic control.

### Primary Goal
- Deliver a working federation that demonstrates democratic coordination across 3–5 cooperatives within 6 months.

### Principles
- Federation over centralization
- Human governance over automatic execution
- Event sourcing for auditability
- Modular adoption
- Boring tech where possible

### In-Scope Outcomes (PoC)
- Identity federation across 3–5 pilot coops and 150+ members
- End-to-end flow: propose resource exchange → democratic approval → execution with audit trail
- Resource discovery, booking, and cost sharing between coops
- At least 25 democratic decisions processed, 50+ inter-coop events recorded

### Out of Scope (PoC Non-Goals)
- Payment rails and complex multi-currency accounting
- Mobile applications
- Advanced privacy techniques (e.g., zero-knowledge)
- AI-mediated governance

### Success Metrics and Acceptance Thresholds
- Unit test coverage: 80% for key modules; 95% on critical paths
- End-to-end tests: green for propose-vote-execute, resource booking, mutual aid request
- Governance throughput: at least 25 decisions processed in staging
- Event auditability: at least 50 inter-coop events with verifiable governance proofs
- Operational reliability: alerts for governance deadlocks, Kafka lag, and 5xx rates are configured and observable

### Milestones and “Done When” Criteria
- 0–30 days
  - Identity federation up, coop and member registration, JWT flow
  - Economic event append and query, minimal governance majority vote
  - Admin UI skeleton, resource registry CRUD
  - Done when: 1 inter-coop proposal approved and recorded end-to-end in dev
- 31–60 days
  - Async event topics wired, read models per coop, discovery search
  - Sociocratic and supermajority models; delegated voting
  - First 2 pilot coops onboarded
  - Done when: resource exchange approved between 2 pilots with audit trail
- 61–90 days
  - Booking and cost sharing workflows
  - Dashboards for quorum health and liquidity indicators
  - 3–5 pilots in staging
  - Done when: 25 decisions, 50 events, 10 bookings in staging with reports

### Architectural Snapshot (for alignment)
- Federation layer: Identity, Event Bus, Governance, Discovery
- Per-coop: Local event store and read models, Governance engine, Admin UI
- Interfaces: REST and GraphQL for apps; gRPC for service-to-service; AsyncAPI topics for events
- Language mapping:
  - Rust: core event store and validation, CLI
  - Python: governance engine, analytics, integration adapters
  - TypeScript: API gateway, web frontend, schema-typed clients

### Domain Model Scope (PoC)
- Key aggregates: `Cooperative`, `Member`, `Proposal`, `Vote`, `SharedResource`, `Booking`, `InterCoopExchange`
- Economic event types:
  - `resource_exchange_proposed`, `resource_exchange_approved`, `resource_exchange_executed`
  - `labor_contribution_recorded`
  - `mutual_aid_requested`, `mutual_aid_fulfilled`
  - `infrastructure_investment_proposed`, `infrastructure_investment_approved`
- Governance events:
  - `proposal_created`, `vote_cast`, `consensus_reached`, `proposal_rejected`
- Event invariants:
  - Any inter-coop event requires governance proof from all affected coops
  - Monetary fields stored in smallest unit to avoid float error
  - Idempotency key per command to prevent duplicates

### Environments and Tooling
- Local via Docker Compose: Postgres, Redis, Kafka, Schema Registry, Keycloak, API Gateway, Governance API, Event Store, Discovery API, Admin UI, Jaeger, Grafana, Prometheus, Loki
- Make targets:
  - `make setup`: generate `.env`, start compose, run migrations, seed dev data
  - `make dev`: hot reload API and governance
  - `make test`: run unit and integration suites

### Test Strategy (Applied to PoC Scope)
- Unit tests: language-native frameworks
- Contract tests: Pact for REST and gRPC
- Integration: docker-compose with seeded data
- End-to-end: headless browser flows for propose-vote-execute
- Governance simulations: Monte Carlo of vote patterns and quorum failures

### Risks and Mitigations (Top Items)
- Governance deadlock → objection resolution window and timeout fallback
- Data partition disagreement → reconciliation jobs and dispute events
- Onboarding friction → templates and guided wizards
- Scope creep → PoC boundaries and change control

### Single Source of Truth
- This document, along with the Governance Process and Contribution Workflow docs, defines the PoC scope and success. Any changes must be proposed as governance-neutral tech RFCs and approved by maintainers before implementation.


