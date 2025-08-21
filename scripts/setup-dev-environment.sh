#!/bin/bash
set -euo pipefail

echo "Setting up ICN Platform development environment..."

command -v docker >/dev/null 2>&1 || { echo "Docker is required." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required." >&2; exit 1; }

mkdir -p infrastructure/docker
mkdir -p config/environments

if [ ! -f config/environments/development.yml ]; then
  cat > config/environments/development.yml <<'YAML'
environment: development
debug: true

database:
  host: localhost
  port: 5432
  name: icn_development
  username: icn_dev
  password: dev_password
  pool_size: 10
  ssl_mode: prefer

redis:
  host: localhost
  port: 6379
  database: 0

kafka:
  brokers:
    - localhost:9092
  topics:
    economic_events: icn.events.economic
    governance_events: icn.events.governance
    system_events: icn.events.system

keycloak:
  server_url: http://localhost:8080
  realm: icn-platform
  client_id: icn-api
  client_secret: change-me

api:
  host: 0.0.0.0
  port: 3000
YAML
fi

echo "Starting infrastructure services..."
docker-compose -f infrastructure/docker/docker-compose.dev.yml up -d

echo "Waiting for services to start..."
sleep 15

echo "Done."


