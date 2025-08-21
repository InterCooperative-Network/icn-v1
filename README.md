# InterCooperative Network (ICN) v1

🌐 **Federated democratic coordination substrate for cooperatives**

## Architecture

- **Event Store** (Rust): CQRS + event sourcing core with type safety
- **Governance Engine** (Python): Democratic decision-making workflows  
- **API Gateway** (TypeScript): Federation coordination & integrations
- **Web Frontend** (React): Member dashboard & admin interfaces

## Quick Start

```bash
# Setup development environment
make setup

# Start all services
make dev

# Run tests
make test
```

## Services

| Service | Language | Port | Purpose |
|---------|----------|------|---------|
| Event Store | Rust | 8001 | Immutable economic event ledger |
| Governance | Python | 8002 | Democratic voting & consensus |
| API Gateway | TypeScript | 8000 | External API & federation |
| Web Frontend | React | 3000 | Member & admin interfaces |

## Documentation

- [Architecture](docs/architecture/)
- [API Reference](docs/api/)
- [Development Guide](docs/development.md)

---

**Mission**: Enable autonomous cooperatives to coordinate democratically at scale
