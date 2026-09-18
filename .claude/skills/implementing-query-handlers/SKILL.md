---
name: implementing-query-handlers
description: Query handler and read-only use case expert. ALWAYS invoke this skill when the user asks about query handlers, read-only use cases, data retrieval patterns, or read-side separation from commands. Do not attempt to write query handlers directly — use this skill first.
---

## Purpose
Query handlers retrieve and aggregate data without side effects. Read-only, no writes, no events.
They can be used for complex read operations that require data shaping, projections, or aggregations that do not fit directly in repositories or domain entities. 
For simple reads that return domain entities without transformation, call repositories directly from http controllers, stream consumers or other adapters.

## Flow
1. Receive input from controller
2. Load data via repository
3. Transform/project 
4. Return result

## Guidelines
**DO:**
- No pass-through query handlers, if domain entity is returned without further transformation call repo directly from adapter
- Stateless, function-like behavior
- Return data, never mutate
- Use simple input types (DTO if needed)
- Keep transformation logic simple and focused on shaping data for the caller
- Define return types in the same file for clarity

**DON'T:**
- No writes, no persistence changes
- No event publishing
- No dependency on other use-cases
- No direct infra logic (HTTP, Kafka, etc.)
- No complex control flow or deep nesting

## TypeScript Specifics
- Declare the projection type in the same file as the handler, below the class, as an `interface` — the shape belongs to the query, and a reader should not have to open a second file to learn what comes back.
- Type collection results as `ReadonlyArray<T>`. A projection is a snapshot, and `readonly` says so at the type level instead of by convention.
- Give the projection an explicit type rather than inferring from a row shape or passing `any` through. When the repository's shape changes, the mismatch should surface as a compile error here rather than as a silently wrong response.

## NestJS Specifics
- Use `@Injectable()` for DI
- Inject repositories via constructor
- Keep query handlers framework-agnostic beyond DI
- Wire to `@Get()` in controllers
