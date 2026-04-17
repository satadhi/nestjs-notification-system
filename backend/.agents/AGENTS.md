# AGENTS.md

## Project
NestJS microservices monorepo for an e-commerce notification flow.

Repository structure:
- `backend/` contains the NestJS monorepo
- `backend/apps/` contains service apps
- `backend/libs/` contains shared libraries
- `docker-compose.yml` starts local infrastructure

## Services
- `order-service`
- `payment-service`
- `inventory-service`
- `notification-service`

## Infrastructure
- PostgreSQL 15 on `localhost:5432`
- RabbitMQ on `localhost:5672`
- RabbitMQ management UI on `localhost:15672`

Default local credentials from `docker-compose.yml`:
- Postgres database: `ecommerce`
- Postgres user: `postgres`
- Postgres password: `postgres`
- RabbitMQ user: `admin`
- RabbitMQ password: `admin`

## Code Notes
- The repo is a Nest monorepo configured in `backend/nest-cli.json`
- Shared message names live in `backend/libs/common/src/events.ts`
- Shared queue names live in `backend/libs/common/src/queues.ts`
- Shared database wiring lives in `backend/libs/database/src`
- App-specific environment files live in `backend/apps/*/.env`

## Current State
- `order-service` has the most implementation and persists orders with TypeORM
- `payment-service`, `inventory-service`, and `notification-service` are still close to scaffold state
- Queue and event constants exist, but messaging integration may be incomplete

## Agent Conventions
- Prefer targeted changes over broad refactors
- Do not revert unrelated user changes
- Use `rg` for search when possible
- Keep edits ASCII unless the file already requires Unicode
- When changing behavior, run the smallest relevant verification command
- Prefer updating existing patterns rather than inventing a new structure
