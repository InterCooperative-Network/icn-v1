# ICN PoC Security Checklist (Minimal)

- Access control: GitHub branch protection on `main`; least-privilege tokens
- Secrets: use env files / GitHub Actions secrets; never commit secrets
- Transport: HTTPS only at edges (gateway); internal dev compose ok for PoC
- AuthN: plan for Keycloak (OIDC); use JWT stubs in gateway if needed
- AuthZ: governance approval required for inter-coop events (to be enforced)
- Logging: JSON, no PII; tie to request id; OTel envs present
- Data: monetary amounts in smallest unit; input validation against schema
- Supply chain: pin base images; run `npm ci`/`pip` with hashes where feasible
- CI: no secrets in logs; ephemeral creds; artifact retention minimal
