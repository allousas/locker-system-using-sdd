---
name: implementing-controllers
description: HTTP controller and REST endpoint expert. ALWAYS invoke this skill when the user asks about HTTP controllers, REST endpoints, API adapters, request/response DTOs, or route handling. Do not attempt to write controllers or endpoint code directly — use this skill first.
---

## Purpose
Thin adapters that translate HTTP requests into application use-cases. No business logic.

## Flow
1. Receive request (DTO)
2. Delegate to use-case (command/query)
3. Map result → response DTO
4. Return HTTP status
5. Let errors propagate

## Guidelines
**DO:**
- Keep controllers thin (no business logic)
- Call application layer (use-cases), not domain or DB directly
- Use small mapping functions
- Use proper HTTP semantics (GET/POST/PUT/PATCH/DELETE) and restful conventions (nouns, pluralization, nesting)
- Return correct status codes (200, 201, 204, etc.)
- Keep files small and focused
- Keep mapping functions in the same file as the controller as private methods or in a separate mapper file if they are complex
- Declare request/response dtos in the same file as the controller, below the controller class, when they are only used by that controller
- Prefer `interface` over `class` for dtos; use a `class` only when runtime decorators need it (e.g. class-validator validation)
- Extract dtos to a separate file close to the controller (e.g. `user.dtos.ts` next to `users.controller.ts`) only when they are shared beyond that scope

**DON'T:**
- No business logic or orchestration
- No direct DB/external calls
- No try/catch (use global exception handler)
- Do not leak HTTP concerns into application layer
- Avoid complex transformations

## Commands vs Queries
- Commands (write): call use-cases
- Queries (read):
    - Simple → query returns directly a domain object → call repositories directly
    - Complex → a projection, aggregation or custom info is needed → use query handlers

## Error Handling
- Use a single global exception handler
- Map domain errors → HTTP responses
- Return consistent error shape

## TypeScript Specifics
- Default a dto to `interface`. Reach for a `class` only when runtime decorators need something to attach to — interfaces are erased at compile time, so a decorator-based `ValidationPipe` has no target and validation silently does nothing.
- Because interfaces are hoisted, a dto declared *below* the controller can still be referenced by a method signature above it. That is what makes the "dtos below the main class" rule cost nothing.
- Let pipes carry transport-level parsing in the signature (`@Param('id', ParseUUIDPipe) id: string`) so the handler body receives values already known-good, and the 400 comes from the framework rather than a hand-rolled check.

## NestJS Specifics
- For global error handling, use `@Catch()` decorator. Register it globally in the main app module.
- Register it once via `APP_FILTER` in the module rather than also calling `app.useGlobalFilters()` — see `configuring-runtime-dependencies`.
