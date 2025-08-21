#!/bin/bash
set -euo pipefail

echo "🔧 Setting up ICN development environment..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not installed"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose not installed"; exit 1; }

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cat > .env << EOF
# Database
DATABASE_URL=postgresql://icn:dev_password_change_me@localhost:5432/icn_dev

# Services
EVENT_STORE_URL=http://localhost:8001
GOVERNANCE_URL=http://localhost:8002
API_GATEWAY_URL=http://localhost:8000

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=icn-dev
KEYCLOAK_CLIENT_ID=icn-api

# Development
RUST_LOG=debug
LOG_LEVEL=debug
NODE_ENV=development
EOF
fi

# Install service dependencies
echo "📦 Installing service dependencies..."

# Rust dependencies
( cd services/event-store && cargo fetch || true )

# Python dependencies
(
  cd services/governance-engine
  if [ ! -d ".venv" ]; then
    python3.11 -m venv .venv || python3 -m venv .venv
  fi
  source .venv/bin/activate
  if [ -f requirements.txt ]; then
    pip install -r requirements.txt
  fi
)

# Node.js dependencies
( cd services/api-gateway && npm ci || npm install )
( cd services/web-frontend && npm ci || npm install )

echo "✅ ICN development environment setup complete!"
echo ""
echo "Next steps:"
echo "  make dev    # Start all services"
echo "  make test   # Run tests"
echo ""
echo "Services will be available at:"
echo "  🌐 Web Frontend:    http://localhost:3000"
echo "  🔗 API Gateway:     http://localhost:8000"
echo "  📊 Event Store:     http://localhost:8001"
echo "  🗳️ Governance:       http://localhost:8002"
echo "  🔐 Keycloak:        http://localhost:8080"
#!/bin/bash
set -euo pipefail

echo "🔧 Setting up ICN development environment..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not installed"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose not installed"; exit 1; }

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cat > .env << EOF
# Database
DATABASE_URL=postgresql://icn:dev_password_change_me@localhost:5432/icn_dev

# Services
EVENT_STORE_URL=http://localhost:8001
GOVERNANCE_URL=http://localhost:8002
API_GATEWAY_URL=http://localhost:8000

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=icn-dev
KEYCLOAK_CLIENT_ID=icn-api

# Development
RUST_LOG=debug
LOG_LEVEL=debug
NODE_ENV=development
