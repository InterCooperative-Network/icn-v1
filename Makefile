.PHONY: help setup dev test clean build deploy

help: ## Show available commands
	@echo "ICN v1 Development Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Setup development environment
	@echo "🔧 Setting up ICN development environment..."
	@./infra/scripts/setup-dev.sh

dev: ## Start all services in development mode
	@echo "🚀 Starting ICN development stack..."
	@docker-compose -f infra/docker/docker-compose.dev.yml up --build

test: ## Run all tests
	@echo "🧪 Running tests..."
	@cd services/event-store && cargo test
	@cd services/governance-engine && python -m pytest
	@cd services/api-gateway && npm test
	@cd services/web-frontend && npm test

clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	@docker-compose -f infra/docker/docker-compose.dev.yml down -v
	@cd services/event-store && cargo clean
	@find . -name "node_modules" -type d -exec rm -rf {} +
	@find . -name "__pycache__" -type d -exec rm -rf {} +

build: ## Build all services
	@echo "🏗️ Building all services..."
	@cd services/event-store && cargo build --release
	@cd services/governance-engine && python -m pip install -r requirements.txt
	@cd services/api-gateway && npm ci && npm run build
	@cd services/web-frontend && npm ci && npm run build

deploy: ## Deploy to staging
	@echo "🚀 Deploying to staging..."
	@kubectl apply -f infra/k8s/staging/
