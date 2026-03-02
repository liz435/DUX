.PHONY: dev test lint format install eval eval-quick

install:  ## Install dependencies
	pip install -e ".[dev]"

dev:  ## Run development server
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:  ## Run tests
	pytest tests/ -v --cov=app --cov-report=term-missing

test-unit:  ## Run unit tests only
	pytest tests/unit/ -v

test-integration:  ## Run integration tests only
	pytest tests/integration/ -v

lint:  ## Run linter
	ruff check app/ tests/
	mypy app/

format:  ## Format code
	ruff format app/ tests/
	ruff check --fix app/ tests/

eval:  ## Run full eval suite (requires LLM API key)
	pytest tests/eval/ -v --timeout=300

eval-quick:  ## Run structural-only evals (no LLM judge, fast)
	pytest tests/eval/ -v -k "structural" --timeout=60
