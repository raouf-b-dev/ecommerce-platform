# Thin wrappers around docker compose and npm gates. Every target prints the
# command it runs, and README.md lists the same commands for shells without
# make (PowerShell, cmd).

COMPOSE ?= docker compose
NPM ?= npm

.DEFAULT_GOAL := help
.PHONY: help env setup up down reset logs update status config urls open observability verify doctor smoke pr bump sync-pins

help: ## List targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  %-14s %s\n", $$1, $$2}'

env: ## Create .env from .env.example (keeps an existing .env)
	@test -f .env || cp .env.example .env

setup: ## Ensure .env, print URLs and next command
	$(NPM) run setup

up: env ## Start the stack and wait until it is healthy
	$(COMPOSE) up -d --wait

down: ## Stop the stack, keep data
	$(COMPOSE) --profile '*' down

reset: env ## Delete all data and start fresh (re-runs migrations and seed)
	$(COMPOSE) --profile '*' down -v --remove-orphans
	$(COMPOSE) up -d --wait

logs: ## Follow logs (one service: make logs s=api)
	$(COMPOSE) logs -f $(s)

update: env ## Pull the versions pinned in .env and restart
	$(COMPOSE) pull
	$(COMPOSE) up -d --wait --remove-orphans

status: ## Show services and health
	$(COMPOSE) --profile '*' ps -a

config: env ## Validate and print the resolved compose file
	$(COMPOSE) config

urls: ## Print demo URLs from .env
	$(NPM) run d:urls

open: ## Open demo URLs in the browser
	$(NPM) run d:open

observability: env ## Start the stack plus Prometheus and Grafana
	$(COMPOSE) --profile observability up -d --wait

verify: env ## Pre-PR gate (pins, compose, ascii, tests)
	$(NPM) run verify

doctor: ## Check Docker, Compose, and .env
	$(NPM) run doctor

smoke: env ## HTTP probes against a running stack
	$(NPM) run smoke

pr: ## Verify, then smoke when the stack is up
	$(NPM) run pr

sync-pins: ## Apply versions.json to .env.example, README, CHANGELOG
	$(NPM) run sync-pins

bump: ## Bump one pin: make bump app=api ver=0.12.0
	$(NPM) run bump -- $(app) $(ver)
