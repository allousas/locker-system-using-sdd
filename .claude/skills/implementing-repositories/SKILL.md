---
name: implementing-repositories
description: Database repository and data access expert. ALWAYS invoke this skill when the user asks about repositories, data access layers, database persistence, entity mapping, or optimistic locking. Do not attempt to write repository classes directly — use this skill first.
---

## Purpose
Database repositories translate domain calls into database operations, handling persistence and retrieval of domain entities.

## Flow
1. Receive domain object or query parameters from use case
2. Map domain objects to database DTOs/parameters
3. Execute query
4. Map database result rows back (or db dto) to domain entities
5. Return domain entity or null depending on the operation

## Guidelines

**DO:**
- Follow the DDD repository pattern. Always load, read, and save complete domain entities through repositories—never perform partial updates or reads.
- Keep database schema simple — avoid complex joins, views, stored procedures
- For complex queries, prefer custom projections or read models built on top of domain events instead of relying on operational data 
  - For these cases, use a different repository
- Declare DTOs in the same file where they are used for cohesion
- Use private methods for simple mapping, dedicated mapper classes for complex transformations
- Keep one repository per entity
- Always use optimistic locking for updates to prevent lost updates in concurrent scenarios with version tracking:
  - Throw a specific exception if updating an outdated version is attempted
  - Update the version at repository level
- Encapsulate DTOs, database models, and private mapping methods directly inside the file where they are used, preventing them from leaking outside that scope.

**DON'T:**
- Have granular field methods to save or update specific fields of an entity — save the whole entity. If partial updates are needed, it's a sign the entity should be split
- Leak DB DTOs OUT of repositories — always map to domain objects, IN and OUT
- Declare transactions here — transactions are declared in use cases
- Include business logic — only translation, mapping, and external system integration
- Push complexity to the database — push it to the domain layer instead
- Throw domain exceptions or return domain errors — those belong in domain/application layers

## TypeScript Specifics
- Return `Promise<Entity | null>` for a lookup that can miss. The absence is then part of the signature, so the caller is forced to handle it rather than discovering `undefined` at runtime.
- Derive row types from the schema rather than hand-writing them, and leave them unexported so the "never leak DB DTOs out" rule above is enforced by the module boundary rather than by review:
  ```typescript
  type LockerRow = Selectable<Database['lockers']>;
  ```
  A migration that changes a column then breaks compilation here, which is exactly where you want to find out.
- Narrow the domain's opaque `Transaction` port to the driver's handle at this boundary, so the domain stays driver-free while the adapter stays typed:
  ```typescript
  export interface KyselyTransaction extends Transaction {
    readonly trx: Kysely<Database>;
  }
  ```
  Validate the handle before use rather than trusting the cast — an inactive or absent transaction should fail with a named infrastructure exception, not a `TypeError` deep in the driver.

## NestJS Specifics
- Use `@Injectable()` for DI
- Bind the repository to its domain port in the module (`{provide: LockerRepository, useClass: PostgresLockerRepository}`) — see `configuring-runtime-dependencies`
