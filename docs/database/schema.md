## ICN Database Schema (PoC Reference)

This document summarizes the PoC key tables and how they map to the initial migration (`database/migrations/001_initial_schema.sql`). It aligns with Section 7 of the Foundational Spec and notes PoC-specific extensions present in the migration.

### Core Tables

- **cooperatives**: cooperative registry with governance model and status fields.
- **members**: member registry scoped to home cooperative; includes governance roles and permissions.
- **economic_events**: immutable event log entries with governance status and metadata.
- **proposals**: governance proposals linked optionally to `economic_events`.
- **votes**: one row per member vote per proposal; supports delegation and objections.
- **shared_resources**: registry of resources available for intercoop discovery and sharing.

### Workflow Tables (PoC extensions)

- **resource_bookings**: booking workflow with approval and status transitions.
- **trust_relationships**: intercoop trust graph used by discovery and policy.
- **audit_logs**: append-only audit trail for administrative actions.

### Notes and Invariants

- Monetary values must be stored in smallest units (no floats) inside `event_data` payloads.
- Idempotency must be enforced at the command layer; events are append-only and may be replayed.
- Governance proofs for intercoop effects are stored in `economic_events.governance_metadata` and linked via `proposals`/`votes`.

For exact DDL, see `database/migrations/001_initial_schema.sql`.


