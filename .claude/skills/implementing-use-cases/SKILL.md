---
name: implementing-use-cases
description: Use case and application service expert. ALWAYS invoke this skill when the user asks about use cases, command handlers, application services, or business action orchestration. Do not attempt to write use cases or command handlers directly — use this skill first.
---

## Purpose
Use-cases orchestrate domain and infrastructure to execute a single business action. No business logic.

## Flow
1. Receive input from controller
2. Load/create entity via repository
3. Call external services if needed
4. Execute domain methods
5. Persist changes
6. Publish events 
7. Return result (if needed)

## Guidelines
**DO:**
- One use-case = one action
- Stateless, function-like behavior
- Use primitives for parameters (create a command/request class in same file if more than 5 params)
- If command/query class is needed, put it in a file close to the use-cases (e.g. `user.types.ts`), add all related types there (e.g. `CreateUserCommand`, `GetUserQuery`, etc.)
- Use cases work on a single aggregate
- Keep orchestration explicit and linear
- Return domain entities or primitives, not DTOs unless domain does not have the needed shape
- Manage transactions
- Publish event using the domain event publisher pattern

**DON'T:**
- No business rules (belongs to domain)
- No dependency on other use-cases
- No direct infra logic (HTTP, Kafka, etc.)
- No logging or metrics (handled at boundaries or through domain events handlers) 
- No complex control flow or deep nesting
- No pass-through use-cases (call repo directly if no domain logic)
- Don't catch infrastructure exceptions to translate or wrap them — let them propagate and be handled at the boundary (see `handling-errors-with-exceptions`)

## Commands vs Queries
- Commands (write):
    - Modify state
    - Persist changes
    - May publish events
- Queries (read): check `implementing-query-handlers` skill for guidelines

## TypeScript Specifics
- Express transactions through a generic port so the callback keeps its own return type instead of collapsing to `unknown`:
  ```typescript
  interface TransactionProvider {
    run<T>(work: (trx: Transaction) => Promise<T>): Promise<T>;
  }
  interface Transaction {}
  ```
  `Transaction` stays deliberately empty — it is an opaque handle. Adapters narrow it to their driver's type (see `implementing-repositories`); the use-case never inspects it.
- Type a command as an `interface` unless runtime decorators require a class. Nothing validates it at this layer, so a class buys nothing over a plain shape.
- Return `Promise<void>` when the action has no result. Returning the saved entity "just in case" invites callers to depend on it.

## NestJS Specifics
- Use `@Injectable()` for DI
- Inject repositories and external services via constructor
- Keep use-cases framework-agnostic beyond DI
- Avoid decorators beyond DI (no HTTP/Kafka concerns)
- Bind the `TransactionProvider` port to its adapter in the module, never construct it here — see `configuring-runtime-dependencies`
