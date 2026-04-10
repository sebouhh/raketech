.PHONY: install dev build lint lint-fix typecheck test test-e2e clean db-generate db-migrate db-push db-studio

## Install all dependencies
install:
	pnpm install

## Start development servers
dev:
	pnpm dev

## Build all packages and apps
build:
	pnpm build

## Run linter
lint:
	pnpm lint

## Run linter with auto-fix
lint-fix:
	pnpm lint:fix

## Run type checker
typecheck:
	pnpm typecheck

## Run unit/integration tests
test:
	pnpm test

## Run E2E tests (requires running server or starts one)
test-e2e:
	pnpm test:e2e

## Clean all build artifacts
clean:
	pnpm clean

## Generate DB migrations from schema
db-generate:
	pnpm --filter @raketech/db db:generate

## Apply pending DB migrations
db-migrate:
	pnpm --filter @raketech/db db:migrate

## Push schema directly to DB (dev only)
db-push:
	pnpm --filter @raketech/db db:push

## Open Drizzle Studio
db-studio:
	pnpm --filter @raketech/db db:studio

## Set up local environment (first-time setup)
setup: install
	@if [ ! -f apps/web/.env.local ]; then \
		cp .env.example apps/web/.env.local; \
		echo "Created apps/web/.env.local from .env.example — fill in real values before running dev"; \
	else \
		echo "apps/web/.env.local already exists, skipping"; \
	fi
