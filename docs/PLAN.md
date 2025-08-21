# ICN v1 — Fresh Monorepo + Website (Execution Plan)

## Status Checklist
- [x] New GitHub repo created (`InterCooperative-Network/icn-v1`), default branch `main` (rename to `icn` blocked; name already exists)
- [x] Contracts added (`contracts/json`, `contracts/asyncapi`, `contracts/proto`, `contracts/openapi`)
- [x] Services present: `event-store` (Rust), `governance-engine` (Python), `api-gateway` (TS)
- [x] Discovery service added (TS) with `/health`, `/resources`, `/resources/search`
- [x] Compose stack updated with discovery, OTel/log envs, named volumes, env_file
- [x] CI workflows green: CI, CI Smoke, CI Lint; Pages deploy green
- [x] CONTRIBUTING and CODEOWNERS added; service READMEs in place
- [x] Security checklist and secrets example committed
- [x] Inter-coop governance gating enforced at gateway (returns 202 + creates proposal when unapproved) — stub; proof verification pending
- [x] Idempotency key support in event-store (in-memory) — persistence to Redis/PG pending
- [ ] Money as first-class type across services and JSON Schemas (smallest unit) — TODO
- [ ] Observability stubs expanded (OTel SDKs per service) — TODO
- [ ] Add Zod schema validation in gateway — TODO
- [ ] Governance voting flows and tests — TODO
- [ ] Rust event-store persistence and tests — TODO

## Notes
- Repo currently at `InterCooperative-Network/icn-v1`. If desired, rename to `icn` when ready.
- CI Smoke builds and runs compose; curl checks for gateway->event-store, governance openapi, and direct event-store append.
- Discovery API baseline offers CRUD stub and search endpoint; expand per WP-05.

## Next Actions
1. Implement event invariants in Rust event-store and governance engine.
2. Add runtime validation (Zod) and typed client with retries to API gateway.
3. Wire basic OTel traces/log context fields.
4. Expand tests to keep CI green while adding features.
5. Replace header-based governance approval with verifiable proof:
   - Governance issues signed approval token for inter-coop proposals
   - Gateway attaches proof to command → Event-store verifies signature before append
6. Persist idempotency keys (Redis/PG) with expiry; include request hash to detect body changes
7. Promote Money type to shared contract/schema; enforce currency codes and non-negative amounts in gateway and event-store
8. Extend CI smoke to cover governance 202 path and approved path; add unit tests in gateway for gating logic
