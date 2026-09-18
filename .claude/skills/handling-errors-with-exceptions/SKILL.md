---
name: handling-errors-with-exceptions
description: Error-handling expert (exceptions, domain or infra errors, error-to-response mapping). ALWAYS invoke this skill whenever code throws, catches, or defines an error — writing or reviewing domain exceptions, deciding where and what to throw, propagating failures, or mapping errors to HTTP responses. Do not write or modify error-handling code directly — use this skill first.
---

## Purpose
Handle failures with exceptions across all layers, and map them to transport responses (HTTP status codes) in a single place. Keep the happy path linear and free of error-shuttling plumbing.

## Principles
Favor the [let-it-crash principle](https://yiming.dev/blog/2022/07/10/how-let-it-fail-leads-to-simpler-code/):
- Treat all domain errors as unlikely by default — they signal an unexpected exception, not as a custom domain error.
- **Monitor exception rates.** If a specific failure occurs frequently, promote it to a custom domain error type for that expected case.
- **Assume UI and internal APIs are not public-facing** — errors are unlikely and would stem from bugs in our own code or internal services, not user input or external factors.
- Use exceptions, not `Either`/`Result` types. `Either` chains (`map`, `flatMap`, `bind`) pollute orchestration in use-cases and hurt readability; exceptions keep the happy path linear.

Trade-off: exceptions are less explicit than `Either`, and stack-trace capture is costly at high throw frequency — both are mitigated by mapping all domain exceptions in one place and monitoring rates. TypeScript has no checked exceptions, so this relies on discipline and monitoring.

## Flow
1. The domain throws a typed error named for the invariant it broke
2. It propagates untouched through the use-case and the controller — no try/catch on the way
3. The one global filter catches `DomainException`
4. The mapping table resolves the concrete error type to a status
5. Exactly one response is sent, in a consistent shape

## Guidelines
**DO:**
- Give every domain error exactly one entry in the status mapping table, added in the same change as the error itself. An unmapped error is not a compile failure — it falls through to 500, so a validation or conflict case silently reports as an internal error.
- Throw typed domain errors from the domain layer, named for the invariant broken (`LockerAlreadyLockedError`)
- Extend a base `DomainException/Error` for every domain error
- Let library/framework exceptions fly untouched by default (DB driver, HTTP client, KafkaJS) — catch them only at infra level if an own infra exception wants to be thrown
- Wrap a library/framework exception in a typed `InfrastructureException` **only when it enriches or adds meaning**, e.g.:
  - translating a Postgres unique-violation into an `OptimisticLockingException`
  - wrapping an HTTP client failure to add the target client name or upstream error code
- Define those infrastructure exceptions in the infrastructure layer, each extending a base `InfrastructureException` — adapters raise these, never domain errors
- Let exceptions propagate untouched through use-cases and controllers

**DON'T:**
- **Never throw or map domain exceptions from infrastructure.** Domain exceptions belong to the domain and application layers only. Adapters (repositories, producers, clients) throw technical errors (DB/connection/serialization failures); they do not raise `DomainException` subtypes.
- No try/catch in controllers or use-cases (except rarely, to add context and rethrow)
- Don't map domain errors to HTTP inside the domain or application layers — that leaks transport concerns inward
- Don't throw generic `Error` for a violated business rule — name it
- Don't return `null` to signal "rule violated" — throw the named error

## TypeScript Specifics
- The base class captures `errorCode` and derives `name` from the concrete subclass, so every subtype is identifiable without per-class boilerplate:
  ```typescript
  export abstract class DomainException extends Error {
    protected constructor(message: string, public readonly errorCode: string) {
      super(message);
      this.name = new.target.name; // no need to set name in each subclass
    }
  }

  export class LockerAlreadyLockedError extends DomainException {
    constructor(lockerId: string) {
      super(`Locker with id ${lockerId} already locked`, 'LOCKER_ALREADY_LOCKED');
    }
  }
  ```
- Use `instanceof` (or `constructor` identity), never string-name comparisons, to branch on error type.
- Infrastructure exceptions live in the infrastructure layer with their own base — same shape, distinct hierarchy so they are never confused with domain errors and are not mapped to 4xx by the domain filter. Keep the original error as `cause`:
  ```typescript
  // infrastructure/infrastructure.errors.ts
  export abstract class InfrastructureException extends Error {
    protected constructor(message: string, public readonly cause?: unknown) {
      super(message);
      this.name = new.target.name;
    }
  }

  export class OptimisticLockingException extends InfrastructureException {
    constructor(entity: string, id: string, cause?: unknown) {
      super(`Concurrent update of ${entity} ${id}`, cause);
    }
  }

  export class HttpClientException extends InfrastructureException {
    constructor(public readonly client: string, public readonly upstreamCode: number, cause?: unknown) {
      super(`Call to ${client} failed with ${upstreamCode}`, cause);
    }
  }
  ```
- Only wrap where the catch adds meaning — otherwise let it propagate:
  ```typescript
  try {
    await this.db.insertInto('lockers').values(row).execute();
  } catch (e) {
    if (isUniqueViolation(e)) throw new OptimisticLockingException('Locker', row.id, e);
    throw e; // unknown driver error → let it fly to the boundary
  }
  ```

## NestJS Specifics

### Global exception handling
- Implement one global filter with `@Catch(DomainException)`; register it once via `APP_FILTER` (see `configuring-runtime-dependencies`). No try/catch in controllers.
- Map each error to a status, send exactly one response, and `return` after sending:
  ```typescript
  import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
  import { DomainException, InvalidCodeError, LockerAlreadyLockedError, LockerNotFoundError }
    from '@/domain/locker.errors';

  const STATUS_BY_ERROR = new Map<Function, number>([
    [LockerNotFoundError, HttpStatus.NOT_FOUND],
    [LockerAlreadyLockedError, HttpStatus.CONFLICT],
    [InvalidCodeError, HttpStatus.BAD_REQUEST],
  ]);

  @Catch(DomainException)
  export class DomainExceptionFilter implements ExceptionFilter {
    catch(exception: DomainException, host: ArgumentsHost) {
      const response = host.switchToHttp().getResponse();
      const status = STATUS_BY_ERROR.get(exception.constructor) ?? HttpStatus.INTERNAL_SERVER_ERROR;

      response.status(status).json({
        timestamp: new Date().toISOString(),
        errorCode: exception.errorCode,
        message: exception.message,
      });
    }
  }
  ```
- `DomainException` is **not** a NestJS `HttpException` — never call `exception.getStatus()` / `getResponse()` on it. The mapping table is the single source of status codes.
- Let NestJS's built-in pipes (`ValidationPipe`, `ParseUUIDPipe`) produce 400s for transport-level input errors; the domain filter is only for `DomainException`.
