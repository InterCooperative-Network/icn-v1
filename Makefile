.PHONY: help setup dev test build deploy clean db-migrate db-seed db-reset lint format docs docs-serve

help:
	@echo "Available targets:"
	@echo "  setup     - Setup development environment"
	@echo "  dev       - Start development environment"
	@echo "  test      - Run tests"
	@echo "  build     - Build all services"
	@echo "  deploy    - Deploy to staging"
	@echo "  clean     - Clean dev environment"

setup:
	@echo "Setting up ICN Platform development environment..."
	./scripts/setup-dev-environment.sh
	@echo "Setup complete! Run 'make dev' to start development."

dev:
	@echo "Starting ICN Platform development environment..."
	docker-compose -f infrastructure/docker/docker-compose.dev.yml up -d

test:
	@echo "Running tests (placeholder)"

build:
	@echo "Building containers (placeholder)"

deploy:
	@echo "Deploying to staging (placeholder)"

clean:
	@echo "Cleaning up development environment..."
	docker-compose -f infrastructure/docker/docker-compose.dev.yml down -v

db-migrate:
	@echo "Running database migrations (placeholder)"

db-seed:
	@echo "Seeding database (placeholder)"

db-reset:
	@echo "Resetting database (placeholder)"

lint:
	@echo "Linting (placeholder)"

format:
	@echo "Formatting (placeholder)"

docs:
	@echo "Generating docs (placeholder)"

docs-serve:
	cd docs && python3 -m http.server 8080

.PHONY: dev stop logs clean

dev:
	docker compose -f infra/docker-compose.dev.yml up --build -d

stop:
	docker compose -f infra/docker-compose.dev.yml down

logs:
	docker compose -f infra/docker-compose.dev.yml logs -f --tail=200

clean: stop
	docker system prune -f
