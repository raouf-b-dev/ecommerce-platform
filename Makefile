# Thin wrappers around docker compose. Every target prints the command it
# runs, and README.md lists the same commands for shells without make
# (PowerShell, cmd).

COMPOSE ?= docker compose

.DEFAULT_GOAL := help
.PHONY: help env up down reset logs update status config observability

help: ## List targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  %-14s %s\n", $$1, $$2}'

env: ## Create .env from .env.example (keeps an existing .env)
	@test -f .env || cp .env.example .env

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
	$(COMPOSE) pull --ignore-pull-failures
	$(COMPOSE) up -d --wait --remove-orphans

status: ## Show services and health
	$(COMPOSE) --profile '*' ps -a

config: env ## Validate and print the resolved compose file
	$(COMPOSE) config

observability: env ## Start the stack plus Prometheus and Grafana
	$(COMPOSE) --profile observability up -d --wait
