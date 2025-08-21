#!/usr/bin/env bash
set -euo pipefail

COMPOSE="docker compose -f infrastructure/docker/docker-compose.dev.yml"

echo "[smoke] Bringing up stack..."
$COMPOSE up -d --build

echo "[smoke] Waiting for API Gateway on :3000 ..."
for i in {1..60}; do
  if curl -fsS http://localhost:3000/health >/dev/null; then
    echo "[smoke] Gateway ready"
    break
  fi
  sleep 2
done

echo "[smoke] Check aggregate health"
curl -fsS http://localhost:3000/api/health | tee /tmp/health.json

echo "[smoke] Register resource"
curl -fsS -X POST http://localhost:3000/api/resources \
  -H 'content-type: application/json' \
  -d '{"name":"Shared Projector","resourceType":"equipment","ownerCooperativeId":"alpha"}' | tee /tmp/resource.json

echo "[smoke] List resources"
curl -fsS http://localhost:3000/api/resources | tee /tmp/resources.json

echo "[smoke] Create proposal"
CREATE_OUT=$(curl -fsS -X POST http://localhost:3000/api/proposals \
  -H 'content-type: application/json' \
  -d '{"title":"Approve Exchange","description":"Test","initiator_id":"member-1","stakeholder_cooperatives":["alpha","beta"]}')
echo "$CREATE_OUT" | tee /tmp/proposal.json
PID=$(echo "$CREATE_OUT" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
if [ -z "${PID}" ]; then
  echo "[smoke] Failed to extract proposal id" >&2
  exit 1
fi

echo "[smoke] Cast vote"
curl -fsS -X POST http://localhost:3000/api/proposals/${PID}/vote \
  -H 'content-type: application/json' \
  -d '{"voter_id":"member-1","vote_type":"approve"}' | tee /tmp/vote.json

echo "[smoke] Get results"
curl -fsS http://localhost:3000/api/proposals/${PID}/results | tee /tmp/results.json

echo "[smoke] Done"


