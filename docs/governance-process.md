## ICN Governance and Decision Process (PoC)

### Purpose
- Define a lightweight, democratic decision process for the PoC that is auditable and implementable across 3–5 pilot cooperatives.

### Governance Models (Initial Set)
- Majority with quorum (default baseline)
- Supermajority for budget above thresholds
- Sociocratic circles for team-level decisions
- Delegated voting optional, with public delegation graph

Default thresholds (configurable per coop):
- Quorum: 0.5
- Majority: 0.5
- Supermajority: 0.66

### Proposal Lifecycle
1. Draft: proposer creates a `proposal_created` governance event linked to an optional `economic_event`
2. Open for voting: rules attached; stakeholders enumerated; deadline set
3. Voting period: votes cast (`vote_cast` events) until deadline or early resolution
4. Tally: governance engine computes result according to rules
5. Resolution: `consensus_reached` or `proposal_rejected`; audit record written and signed by coop keys
6. Execution: if approved and applicable, linked economic command is executed; events appended

### Roles and Responsibilities
- Proposer: authors proposal, sets rules within allowed policy
- Members: cast votes; may delegate where allowed
- Governance Engine: validates rules, collects votes, computes tally, writes audit results
- Maintainers: review governance-neutral RFCs and ensure policy compliance

### Voting Rules Schema (PoC)
- Model: `majority` | `supermajority` | `sociocratic_circles`
- Quorum threshold: 0–1
- Approval threshold: 0–1 (derived from model if omitted)
- Voting period (hours)
- Delegate voting allowed: boolean

### Evidence and Audit Requirements
- Every governance decision produces a signed `GovernanceProof` attached to resulting events
- All votes and tallies are recorded as events in the local coop event store and replicated to federation topics
- Idempotency enforced via command keys; replays must yield identical results

### Event Contracts
- Governance events: `proposal_created`, `vote_cast`, `consensus_reached`, `proposal_rejected`
- Economic events must reference governance proof when cross-coop effects occur

### Escalation and Deadlock Handling
- Objection window: if quorum met but contested, allow objection submission before finalization
- Timeout fallback: if quorum not met by deadline, proposer may extend once; otherwise auto-reject
- Dispute events: record `dispute_raised` for transparency and resolution tracking

### Process Interfaces
- REST
  - `POST /api/v1/proposals` — create proposal
  - `POST /api/v1/proposals/{id}/vote` — cast vote
  - `GET /api/v1/proposals/{id}/results` — view tally and audit record
- gRPC
  - `Governance.InitiateVoting` — start a voting session
  - `Governance.Tally` — compute and fetch result
- AsyncAPI Topics
  - `icn.events.governance.proposals`
  - `icn.events.governance.votes`

### Implementation Notes
- Governance Engine (Python): rules validation, vote collection, tally per model; sociocratic logic isolated for extension
- Event Store (Rust initially via Python prototype): append-only, idempotent, with per-coop read models
- API Layer (TypeScript): initiates proposals, proxies to governance engine, enforces RBAC and claim scopes

### Security and Compliance
- Identity via Keycloak (OIDC/SAML); claims mapped to coop and network roles
- RBAC enforced at API and read models; row-level security for coop-scoped reads
- All governance outputs signed with coop keys; JWTs short-lived with refresh

### Metrics and Observability
- Governance latency (proposal → resolution)
- Quorum rate and rejection rate per model
- Deadlock incidents and objection resolutions
- Tracing via OpenTelemetry; dashboards in Grafana

### Change Control
- Governance rules and process changes require a governance-neutral RFC
- Maintainers must approve; automated checks validate API and schema diffs


