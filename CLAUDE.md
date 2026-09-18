# CLAUDE.md

## Project

Locker microservice — allows users to lock and unlock resources.

## Tech Stack

- **Runtime:** Node.js, TypeScript
- **Framework:** NestJS
- **Messaging:** in-process event bus (`InMemoryDomainEventDispatcher`); no broker yet — Kafka deferred until events must leave the service
- **Database:** PostgreSQL (Kysely + dbmate). dbmate is a Go binary, not a pnpm dependency — `brew install dbmate`. Integration tests invoke it too (`test/fixtures/migrate.ts`), so they need both Docker and the binary.
- **Package manager:** pnpm
- **Testing:** Jest
- **Build:** tsc (dev), tsup (prod bundle)

## Commands

```bash
pnpm install          # install dependencies
pnpm build            # production build via tsup
pnpm start:dev        # start in watch mode
pnpm test             # run unit tests
pnpm test -- --testPathPattern=<pattern>  # run a single test file
pnpm test:integration # run integration tests (needs pnpm db:up)
pnpm lint             # lint with eslint
pnpm lint --fix       # auto-fix lint issues

# Database — copy .env.example to .env first, dbmate reads DATABASE_URL from it
pnpm db:up            # start the Postgres container
pnpm db:migrate       # apply pending migrations
pnpm db:rollback      # roll back the last migration
pnpm db:status        # list applied and pending migrations
pnpm db:new <name>    # create a timestamped migration file
pnpm db:down          # stop the container and delete its volume
```

## Architecture

Lightweight hexagonal architecture with clear separation of concerns:
```
src/
 ├── domain/                  -- core business logic, entities, ports definitions
 ├── application/use-cases/   -- use cases
 └── infrastructure/          
     └── inbound/             -- Inbound adapters: http controllers, message consumers
     └── outbound/            -- Outbound adapters: repositories, message producers
     └── config/              -- configuration files
```
- Main principles:
  - Clear separation of concerns: domain, application, infrastructure (no extra packages/folders at root)
  - Dependency rule: domain has no dependencies, application depends on domain, infrastructure depends on domain
  - Ports and adapters: domain defines ports, infrastructure implements them
  - Use cases orchestrate domain and infrastructure (through ports) to execute business actions, but contain no business logic
  - Domain entities contain all business logic and rules, and are the source of truth for the state and behavior of the system
- Architectural shortcuts:
  - No inbound ports/interfaces — controllers and consumers directly call use cases.
  - Domain leaked into infrastructure for simplicity - domain entities can be passed around into controllers, repositories ... as method arguments and return types without dtos or mappers.

## Conventions

- Naming: 
  - Files: kebab-case (e.g. `lock.use-case.ts`)
  - Classes: PascalCase (e.g. `LockUseCase`)
  - Methods: camelCase (e.g. `execute()`)
  - Never use Impl suffix for implementations, use descriptive names instead (e.g. `PostgresLockerRepository` instead of `LockerRepositoryImpl`)
- Types (dtos, domain, exceptions ...) are wrapped close together in one file instead of one file per class (e.g. `locker.events.ts`, `outbound.ports.ts`) 
  - Request/response dtos used by a single adapter live in that adapter's file, declared below the main class, and are `interface`s unless runtime decorators need a `class` (e.g. `LockLockerHttpDto` in `locker.controller.ts`). Extract to a `<feature>.dtos.ts` only once shared.
- Use cases should be single-purpose and contain only business logic.
- Immutable data structures. Avoid mutating objects. Create new ones instead.
- Clean code:
  - **Clean Code Only:** Write self-documenting code with self-descriptive variable and function names.
  - **No Unnecessary Comments:** Omit redundant or explanatory comments. Use comments only for essential "why" context or non-obvious workarounds.
  - **Single Responsibility:** Keep functions small, focused, and under 30 lines whenever possible.


## Specs
- Specs live in `docs/specs/`
- Format: `<feature>.md`
- validating-changes-against-specs skill validates implementation against these specs
