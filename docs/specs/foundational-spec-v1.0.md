## InterCooperative Network - Proof of Concept Foundational Specification v1.0

**Audience:** core devs, AI agents, pilot cooperatives.

**Goal:** deliver a working federation that demonstrates democratic coordination across 3 to 5 cooperatives within 6 months.

---

## 1. Purpose and Outcomes

**Purpose:** implement a thin coordination layer that lets autonomous cooperatives trade, share resources, and decide together - with auditability and democratic control.

**Target Outcomes for PoC:**
- Identity federation across 3 to 5 pilot coops and 150+ members.
- End to end flow: propose resource exchange - democratic approval - execution and audit trail.
- Resource discovery, booking, and cost sharing between coops.
- 25+ democratic decisions processed, 50+ intercoop events recorded.

**Non goals for PoC:** payments rails, mobile apps, complex multi currency, advanced privacy like ZK, AI mediated governance. These are later phases.

---

## 2. Architectural Overview

**Principles:** federation over centralization, human governance over automatic execution, event sourcing for auditability, modular adoption, boring tech where possible.

**High level diagram:**
- Federation layer: Identity - Event Bus - Governance - Discovery.
- Per coop: Local event store and read models - Governance engine - Admin UI.
- Interfaces: REST and GraphQL for apps - gRPC for service to service - AsyncAPI topics for events.

---

## 3. Component Language Mapping

**Rationale:** critical path in Rust for safety and throughput, complex and evolving governance in Python, integration heavy APIs in TypeScript.

### 3.1 Event Store and CQRS Core - Rust

```rust
#[derive(Serialize, Deserialize, Debug)]
pub struct EconomicEvent {
    pub event_id: EventId,
    pub event_type: EconomicEventType,
    pub aggregate_id: AggregateId,
    pub timestamp: DateTime<Utc>,
    pub amount: Money,
    pub participants: Vec<CooperativeId>,
    pub governance_approval: GovernanceProof,
}

impl EconomicEvent {
    pub fn new(
        event_type: EconomicEventType,
        amount: Money,
        participants: Vec<CooperativeId>,
        governance_approval: GovernanceProof,
    ) -> Result<Self, EconomicEventError> {
        if amount.is_negative() && !event_type.allows_negative() {
            return Err(EconomicEventError::InvalidNegativeAmount);
        }
        governance_approval.validate_for_event_type(&event_type)?;
        Ok(Self {
            event_id: EventId::new(),
            event_type,
            aggregate_id: AggregateId::from_participants(&participants),
            timestamp: Utc::now(),
            amount,
            participants,
            governance_approval,
        })
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Money { cents: i64, currency: Currency }
```

### 3.2 Democratic Governance Engine - Python

```python
from typing import List
from dataclasses import dataclass
from enum import Enum
import asyncio

class GovernanceModel(Enum):
    CONSENSUS = "consensus"
    CONSENSUS_MINUS_ONE = "consensus_minus_one"
    MAJORITY = "majority"
    SUPERMAJORITY = "supermajority"
    SOCIOCRATIC_CIRCLES = "sociocratic_circles"

@dataclass
class GovernanceRules:
    model: GovernanceModel
    quorum_threshold: float
    approval_threshold: float
    voting_period_hours: int
    delegate_voting_allowed: bool

class GovernanceEngine:
    async def process_proposal(self, proposal, rules: GovernanceRules):
        votes = await self.collect_votes(proposal, rules.voting_period_hours)
        if rules.model == GovernanceModel.SOCIOCRATIC_CIRCLES:
            return await self.process_sociocratic_decision(proposal, votes)
        # ... other models
```

### 3.3 API Layer and Integrations - TypeScript

```ts
interface CooperativeAPIContext { member: MemberIdentity; cooperative: CooperativeInfo; permissions: NetworkPermissions; }

class ICNApiGateway {
  async processEconomicCommand(cmd: EconomicCommand, ctx: CooperativeAPIContext) {
    const event = await this.rustEventStore.createEvent({ /* ... */ });
    if (cmd.governance_requirements.requires_voting) {
      await this.pythonGovernanceEngine.initiateVoting(event);
    }
    return { success: true, event_id: event.id };
  }
}
```

**Mapping summary:**
- Rust - core event store and validation, CLI.
- Python - governance engine, analytics, integration adapters.
- TypeScript - API gateway, web frontend, schema typed clients.

---

## 4. Domain Model and Event Taxonomy

**Key aggregates:** Cooperative, Member, Proposal, Vote, SharedResource, Booking, InterCoopExchange.

**Economic event types for PoC:**
- resource_exchange_proposed, resource_exchange_approved, resource_exchange_executed.
- labor_contribution_recorded.
- mutual_aid_requested, mutual_aid_fulfilled.
- infrastructure_investment_proposed, infrastructure_investment_approved.

**Governance events:** proposal_created, vote_cast, consensus_reached, proposal_rejected.

**Event invariants:**
- Any intercoop event requires governance proof from all affected coops.
- Monetary fields stored in smallest unit to avoid float error.
- Idempotency key per command to prevent duplicates.

---

## 5. Governance Models - Initial Set

- Majority with quorum - default baseline.
- Supermajority for budget above threshold.
- Sociocratic circles for team level decisions.
- Delegated voting optional, with public delegation graph.

**Thresholds for PoC:** configurable per coop. Default: quorum 0.5, majority 0.5, supermajority 0.66.

---

## 6. Interface Contracts

### 6.1 REST endpoints - OpenAPI stub

```
POST /api/v1/cooperatives
GET  /api/v1/cooperatives/{id}
POST /api/v1/members
POST /api/v1/events
GET  /api/v1/events?type=...
POST /api/v1/proposals
POST /api/v1/proposals/{id}/vote
GET  /api/v1/proposals/{id}/results
POST /api/v1/resources
GET  /api/v1/resources/search
POST /api/v1/resources/{id}/request
```

### 6.2 gRPC services - proto stubs

```
service EventStore {
  rpc AppendEvent(EconomicEvent) returns (EventResult);
  rpc StreamEvents(EventQuery) returns (stream EconomicEvent);
}
service Governance {
  rpc InitiateVoting(VotingRequest) returns (VotingSession);
  rpc Tally(ProposalRef) returns (GovernanceResult);
}
```

### 6.3 AsyncAPI topics

- icn.events.economic.proposed
- icn.events.economic.approved
- icn.events.economic.executed
- icn.events.governance.proposals
- icn.events.governance.votes

---

## 7. Data Model - Key Tables

```sql
CREATE TABLE cooperatives (
  id UUID PRIMARY KEY,
  legal_name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  governance_model TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE members (
  id UUID PRIMARY KEY,
  member_id TEXT UNIQUE NOT NULL,
  home_cooperative_id UUID REFERENCES cooperatives(id),
  email TEXT UNIQUE NOT NULL,
  roles JSONB,
  skills JSONB,
  reputation_score NUMERIC(3,2) DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE economic_events (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  initiator_id UUID REFERENCES members(id),
  participants JSONB,
  event_data JSONB NOT NULL,
  governance_status TEXT DEFAULT 'pending',
  governance_metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE proposals (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  initiator_id UUID REFERENCES members(id),
  related_event_id UUID REFERENCES economic_events(id),
  voting_rules JSONB,
  stakeholders JSONB,
  status TEXT DEFAULT 'draft',
  deadline TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE votes (
  id UUID PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id),
  voter_id UUID REFERENCES members(id),
  vote_type TEXT,
  reasoning TEXT,
  vote_weight NUMERIC(10,4) DEFAULT 1.0,
  cast_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE shared_resources (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  resource_type TEXT,
  owner_cooperative_id UUID REFERENCES cooperatives(id),
  description TEXT,
  location JSONB,
  availability_schedule JSONB,
  access_model TEXT,
  cost_model JSONB,
  requirements JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 8. Identity and Auth

- Identity provider: Keycloak. Protocols: OIDC and SAML.
- Federation: coops registered as identity clients. Members stored at home coop, federated claims mapped to roles.
- Access control: RBAC with coop scoped and network scoped permissions.
- Audit: sign all governance results with coop keys.

---

## 9. Development Environment

**Docker Compose services:**
- postgres, redis, kafka, schema-registry, keycloak, api-gateway, governance-api, event-store, discovery-api, admin-ui, jaeger, grafana, prometheus, loki.

**Local bootstrap:**
- `make setup` - generate .env, start compose, run migrations, seed dev data.
- `make dev` - hot reload API and governance.
- `make test` - unit and integration suites.

---

## 10. CI and CD

- GitHub Actions workflows: lint, unit, integration, e2e, container build, SBOM, Trivy scan.
- Required checks before merge: tests pass, OpenAPI diff approved, migration up and down tested, AsyncAPI schema validation, license header check.
- Environments: dev, staging, pilot.

---

## 11. Observability

- Tracing: OpenTelemetry to Jaeger.
- Metrics: Prometheus - event throughput, governance latency, quorum rate, rejection rate.
- Logs: Loki with structured JSON.
- Alerts: Pager rules on governance deadlocks, Kafka lag, 5xx rates.

---

## 12. Security

- Secrets via Vault. TLS everywhere. JWT with short lifetimes and refresh.
- Database roles per service. Row level security for coop scoped reads.
- Supply chain: signed images, SBOM published, dependency pinning.
- Backups: daily Postgres and Keycloak exports. Restore drills monthly.

---

## 13. Test Strategy

- Unit tests - language native frameworks.
- Contract tests - Pact for REST and gRPC.
- Integration - docker compose up with seeded data.
- End to end - headless browser flows for propose-vote-execute.
- Governance sims - Monte Carlo of vote patterns and quorum failures.

Acceptance thresholds for PoC:
- 80 percent unit coverage key modules, 95 percent of critical paths.
- E2E green on propose-vote-execute, resource booking, mutual aid request.

---

## 14. Milestones and Acceptance Criteria

**0 to 30 days:**
- Identity federation up, coop and member registration, JWT flow.
- Economic event append and query, minimal governance majority vote.
- Admin UI skeleton, resource registry CRUD.
**Done when:** 1 intercoop proposal approved and recorded end to end in dev.

**31 to 60 days:**
- Async event topics wired, read models per coop, discovery search.
- Sociocratic and supermajority models. Delegate voting.
- First 2 pilot coops onboarded.
**Done when:** resource exchange approved between 2 pilots with audit trail.

**61 to 90 days:**
- Booking and cost sharing workflows.
- Dashboards for quorum health and liquidity indicators.
- 3 to 5 pilots in staging.
**Done when:** 25 decisions, 50 events, 10 bookings in staging with reports.

---

## 15. Work Packages for AI Agents

**WP-01 Schema and Migrations** - Postgres DDL above, migration scripts up and down, seed.
**Definition of done:** migrations idempotent, rollback tested, schema diff snapshots.

**WP-02 OpenAPI and GraphQL** - Define endpoints in section 6.1, generate server stubs for TS and client SDKs.
**DoD:** CI lints spec, SDKs published, contract tests pass.

**WP-03 Event Store Prototype** - Python event store with append and query, swap to Rust trait later.
**DoD:** passes concurrency tests, idempotency enforced, persistence durable.

**WP-04 Governance Engine v1** - Majority with quorum, proposal lifecycle state machine, vote tally.
**DoD:** E2E test proves reject and approve paths, audit record written.

**WP-05 Discovery API** - Resource registry, search filters, availability.
**DoD:** pagination, ACL checks, search latency P95 under 200 ms.

**WP-06 Federation Auth** - Keycloak realm, clients, role mapper, JWT middleware.
**DoD:** cross coop access with scoped claims, RBAC enforced in API.

**WP-07 Observability Base** - OTel traces, metrics, structured logs.
**DoD:** golden signals visible in Grafana, alert routes configured.

**WP-08 CI baselines** - Actions for lint, test, build, scan.
**DoD:** required checks enforced, supply chain scan green.

**WP-09 Hardening Pass** - Threat model, secrets rotation, RLS policies.
**DoD:** security checklist green, penetration test smoke passes.

**WP-10 Rust Event Store** - Replace Python core with Rust service implementing gRPC.
**DoD:** throughput 1k events per second on dev hardware, parity tests green.

---

## 16. Contribution Workflow for AI Agents

- Branch naming: feature/, fix/, chore/.
- Conventional commits. Changelog from commits.
- PR template includes threat model delta, API diffs, migration diffs.
- Code owners: event store, governance, api, infra.
- Automated reviewers: schema bot, security bot, performance bot.

---

## 17. Risk Register - Top Items

- Governance deadlock - mitigated by objection resolution window and timeout fallback.
- Data partition disagreement - mitigated by reconciliation jobs and dispute events.
- Onboarding friction - mitigated by templates and guided wizards.
- Scope creep - mitigated by PoC boundaries and change control.

---

## 18. Appendices

### A. JSON Schemas - Economic Events

```json
{
  "$id": "icn.events.resource_exchange_proposed",
  "type": "object",
  "properties": {
    "event_type": {"const": "resource_exchange_proposed"},
    "data": {
      "type": "object",
      "properties": {
        "resource_id": {"type": "string", "format": "uuid"},
        "requesting_cooperative": {"type": "string", "format": "uuid"},
        "offering_cooperative": {"type": "string", "format": "uuid"},
        "requested_period": {
          "type": "object",
          "properties": {
            "start_date": {"type": "string", "format": "date"},
            "end_date": {"type": "string", "format": "date"}
          },
          "required": ["start_date", "end_date"]
        },
        "exchange_terms": {
          "type": "object",
          "properties": {
            "cost_sharing_amount": {"type": "integer"},
            "barter_offered": {"type": "string"},
            "labor_exchange_hours": {"type": "integer"}
          }
        },
        "purpose": {"type": "string"},
        "insurance_arranged": {"type": "boolean"}
      },
      "required": ["resource_id", "requesting_cooperative", "offering_cooperative"]
    }
  },
  "required": ["event_type", "data"]
}
```

### B. AsyncAPI Skeleton

```yaml
asyncapi: 3.0.0
info:
  title: ICN Event Topics
  version: 0.1.0
channels:
  icn.events.economic.proposed:
    address: icn.events.economic.proposed
    messages:
      EconomicEvent:
        name: EconomicEvent
        payload:
          $ref: '#/components/schemas/EconomicEvent'
components:
  schemas:
    EconomicEvent:
      type: object
      properties:
        event_id: { type: string }
        event_type: { type: string }
        aggregate_id: { type: string }
        timestamp: { type: string, format: date-time }
        event_data: { type: object }
```

### C. Protobuf Stubs

```proto
syntax = "proto3";
package icn;

message EconomicEvent { string event_id = 1; string event_type = 2; string aggregate_id = 3; string timestamp = 4; bytes event_data = 5; }
message EventResult { bool ok = 1; string id = 2; }
service EventStore { rpc AppendEvent(EconomicEvent) returns (EventResult); }
```

### D. OpenAPI Head

```yaml
openapi: 3.1.0
info: { title: ICN API, version: 0.1.0 }
servers: [{ url: https://api.icn.local }]
paths:
  /api/v1/proposals:
    post:
      summary: Create proposal
      requestBody: { required: true }
      responses: { '201': { description: Created } }
```

---

This document is the single source of truth for the PoC. Any changes must be proposed as governance-neutral tech RFCs and approved by maintainers before implementation.



