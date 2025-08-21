# Development Setup and JWT Configuration

## Start the stack

- make setup
- make dev
- Optionally run services locally:
  - make dev-api
  - make dev-governance
  - make dev-identity
  - make dev-discovery
  - make dev-frontend

## JWT / Keycloak integration

By default, the gateway runs in dev mode with header-based auth stub.

Environment variables to enable JWT:

- JWT_ENABLED: set to true to enable JWT validation
- JWT_JWKS_URI: Keycloak JWKS endpoint, e.g. http://keycloak:8080/realms/icn-platform/protocol/openid-connect/certs
- JWT_ISSUER: expected issuer, e.g. http://keycloak:8080/realms/icn-platform
- JWT_AUDIENCE: expected audience (client id), e.g. icn-api

Update infrastructure/docker/docker-compose.dev.yml to flip JWT_ENABLED and configure values.

## Frontend

- cd web-frontend && npm run dev
- Configure VITE_API_URL to point to the gateway if needed.
