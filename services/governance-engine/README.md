# Governance Engine (Python/FastAPI)

OpenAPI available at `/openapi.json` on port 8000.

## Dev
```
pip install -r services/governance-engine/requirements.txt
uvicorn services.governance-engine.main:app --host 0.0.0.0 --port 8000
# or via compose
make dev
```
