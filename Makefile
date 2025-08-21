.PHONY: dev stop logs clean

dev:
	docker compose -f infra/docker-compose.dev.yml up --build -d

stop:
	docker compose -f infra/docker-compose.dev.yml down

logs:
	docker compose -f infra/docker-compose.dev.yml logs -f --tail=200

clean: stop
	docker system prune -f
