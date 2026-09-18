---
name: configuring-runtime-dependencies
description: NestJS runtime wiring and dependency-injection expert. ALWAYS invoke this skill when the user asks about NestJS modules, dependency injection, binding ports to adapters, injection tokens, provider registration, or global pipes/filters/interceptors. Do not attempt to wire modules or configure DI directly — use this skill first.
---

## Purpose
The composition root. This is where the application is assembled: domain ports (interfaces) are bound to their infrastructure adapters, use-cases are registered, and global cross-cutting providers (validation, exception mapping) are configured. Framework wiring lives here and nowhere else.

## Flow
1. Define ports in the domain layer (no framework types)
2. Implement adapters in the infrastructure layer
3. In a module under `infrastructure/config`, bind each port to its adapter
4. Register use-cases as providers
5. Register global providers (pipes, filters) at the composition root

## Guidelines
**DO:**
- Keep all wiring in modules under `infrastructure/config`
- Bind each outbound port to exactly one adapter
- Register use-cases as providers so their dependencies are resolved by DI
- Register cross-cutting concerns (validation, error mapping) once, globally
- Keep modules declarative — a list of controllers, providers, and bindings

**DON'T:**
- No business logic, orchestration, or mapping in modules
- No `new` of adapters inside use-cases or controllers — let DI construct them
- Don't scatter the same provider across multiple modules
- Don't register a global filter both via `APP_FILTER` and `app.useGlobalFilters()` — pick one

## TypeScript Specifics
- **TypeScript interfaces are erased at compile time — they cannot be DI tokens.** Injecting a bare interface type (`private readonly repo: LockerRepository`) emits `Object` as the design type, and Nest fails at boot with *"Nest can't resolve dependencies"*. A port needs a value that exists at runtime.
- Two ways to give a port a runtime token:

  **1. Preferred — `abstract class` as the port.** It exists at runtime, doubles as type *and* token, needs no `@Inject`, and stays framework-free (no decorators):
  ```typescript
  // domain/outbound.ports.ts
  export abstract class LockerRepository {
    abstract find(id: string): Promise<Locker | null>;
    abstract save(locker: Locker, trx: Transaction): Promise<void>;
  }
  ```
  ```typescript
  // use-case — plain constructor injection, no @Inject needed
  constructor(private readonly lockerRepository: LockerRepository) {}
  ```

  **2. Alternative — `interface` + `string`/`Symbol` token.** Keeps the domain as pure interfaces at the cost of an explicit `@Inject` at every call site:
  ```typescript
  export const LOCKER_REPOSITORY = Symbol('LockerRepository');
  // ...
  constructor(@Inject(LOCKER_REPOSITORY) private readonly repo: LockerRepository) {}
  ```

  Trade-off: (1) is more ergonomic and type-safe; (2) keeps the domain expressed purely as interfaces. Pick one convention and apply it to every port.

## NestJS Specifics
- Bind port → adapter with `useClass`:
  ```typescript
  @Module({
    controllers: [HealthController, LockerController],
    providers: [
      LockUseCase,
      { provide: LockerRepository, useClass: PostgresLockerRepository },
      { provide: TransactionProvider, useClass: KyselyTransactionProvider },
      { provide: DomainEventPublisher, useClass: InMemoryDomainEventDispatcher },
    ],
  })
  export class AppModule {}
  ```
- Register global cross-cutting providers via the `APP_*` tokens so they can themselves use DI:
  ```typescript
  import { APP_FILTER, APP_PIPE } from '@nestjs/core';
  // ...providers:
  { provide: APP_PIPE, useClass: ValidationPipe },   // DTO validation
  { provide: APP_FILTER, useClass: DomainExceptionFilter }, // error mapping — see handling-errors-with-exceptions
  ```
- `useValue` for fakes/config, `useFactory` when a provider needs runtime construction (e.g. a Kysely pool from env).
- If a provider must be visible to other modules, add it to `exports`.
