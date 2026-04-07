# ── Juno dev management ─────────────────────────────────────────────────────
# Requires: Docker Desktop (for full stack) OR local postgres + python venv
#
# make dev          Start everything with hot-reload (Docker)
# make dev-local    Start without Docker (postgres must be running locally)
# make stop         Stop all services
# make logs         Tail logs from all services
# make migrate      Run DB migrations
# make rebuild      Rebuild Docker images and restart
# make clean        Remove containers, volumes, caches

.PHONY: dev dev-local stop logs migrate rebuild clean

# ── Docker-based full stack ──────────────────────────────────────────────────

dev:
	@echo "Starting all services with hot-reload..."
	docker compose up --build

dev-detach:
	@echo "Starting all services in background..."
	docker compose up --build -d
	@echo "Logs: make logs"

stop:
	docker compose down

logs:
	docker compose logs -f

logs-api:
	docker compose logs -f api

logs-web:
	docker compose logs -f web

migrate:
	docker compose run --rm api sh -c "PYTHONPATH=. alembic upgrade head"

rebuild:
	docker compose down
	docker compose build --no-cache
	docker compose up -d

clean:
	docker compose down -v --remove-orphans
	rm -rf web/.next api/.venv

# ── Local (no Docker) ────────────────────────────────────────────────────────
# Requires: postgresql@17 running, api/.env present, web/.env.local present

dev-local:
	@echo "Starting API + web locally (postgres must be running)..."
	@$(MAKE) _check-pg
	@$(MAKE) _migrate-local
	@trap 'kill %1 %2 2>/dev/null' INT; \
	  cd api && PYTHONPATH=. .venv/bin/uvicorn app.main:app --port 8000 --reload & \
	  cd web && npm run dev & \
	  wait

stop-local:
	@pkill -f "uvicorn app.main:app" 2>/dev/null && echo "API stopped" || true
	@pkill -f "next dev" 2>/dev/null && echo "Web stopped" || true

_migrate-local:
	cd api && PYTHONPATH=. .venv/bin/alembic upgrade head

_check-pg:
	@pg_isready -h localhost -p 5432 > /dev/null 2>&1 || \
	  (echo "PostgreSQL not running. Run: brew services start postgresql@17" && exit 1)

# ── Setup (first time) ───────────────────────────────────────────────────────

setup-local:
	@echo "Setting up local dev environment..."
	cd api && python3 -m venv .venv && \
	  .venv/bin/pip install -q "pydantic[email]" fastapi "uvicorn[standard]" \
	    "sqlalchemy[asyncio]" asyncpg alembic pgvector pydantic-settings \
	    "python-jose[cryptography]" "passlib[bcrypt]" httpx python-multipart openai
	cd web && npm install
	@echo ""
	@echo "Done. Copy api/.env.example -> api/.env and fill in secrets."
	@echo "Copy web/.env.local.example -> web/.env.local and fill in secrets."
	@echo "Then: make migrate-local && make dev-local"

migrate-local: _check-pg _migrate-local
	@echo "Migrations applied."
