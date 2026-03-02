.PHONY: dev dev-frontend dev-backend test test-backend test-frontend install lint

install:  ## Install all dependencies
	cd frontend && npm install
	cd backend && pip install -e ".[dev]"

dev:  ## Run both frontend and backend (use two terminals, or docker-compose)
	@echo "Run 'make dev-frontend' and 'make dev-backend' in separate terminals"
	@echo "Or use: docker compose up"

dev-frontend:  ## Start frontend dev server
	cd frontend && npm run dev

dev-backend:  ## Start backend dev server
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:  ## Run all tests
	cd backend && pytest tests/ -v

test-backend:  ## Run backend tests
	cd backend && pytest tests/ -v --cov=app --cov-report=term-missing

test-frontend:  ## Run frontend tests
	cd frontend && npm test

lint:  ## Lint all code
	cd backend && ruff check app/ tests/
	cd frontend && npm run lint

build:  ## Build for production
	cd frontend && npm run build
	@echo "Backend has no build step (pure Python)."
