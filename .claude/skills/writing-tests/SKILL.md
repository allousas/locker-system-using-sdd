---
name: writing-tests
description: Testing expert. ALWAYS invoke this skill when the user asks about writing tests, test structure, fakes vs mocks, testing controllers/use-cases/domain/repositories, or test conventions. Do not attempt to write tests directly — use this skill first.
---

## Purpose
Tests describe behavior and protect invariants. Each layer is tested at the altitude where its logic lives: business rules in the domain, orchestration in use-cases, transport in adapters.

## Flow
Test pyramid — many fast tests at the base, few slow ones at the top:

```
    ╱ component / acceptance ╲      Validates the entire application as a runnable black box by testing end-to-end flows, API inputs/outputs, and external side effects (events, state changes) 
    ──────────────────────────
  ╱         integration         ╲   Validates I/O boundaries and adapters (HTTP contracts, serialization, and real DB queries via Testcontainers).
  ───────────────────────────────  
╱              unit               ╲ Validates pure domain logic and business use-cases in isolation with zero I/O (fastest & cheapest).
```

Each tier answers a different question: 
- Unit asks *is the logic right*, 
- Integration asks *does the boundary speak the right protocol*, 
- Component asks *does the service do what was promised*. 

## Guidelines
**DO:**
- One behavior per test; name it as a sentence: *should fail locking a locker when it is not found*
- Follow Given / When / Then structure inside the test body
- Test the domain with pure unit tests — no mocks, no framework. Assert state transitions and that invariants throw the right typed error
- Prefer **fakes** (small hand-written implementations of a port) over mocks when the test needs realistic behavior; 
- Use mocks for stubbing or verification of side effects
- Assert on observable outcomes (returned value, saved entity, published event, HTTP status), not internal calls where an outcome is available
- Exercise error-to-response mapping through a **real request**, never by calling the handler directly. The mapping only exists at the transport boundary, so that is the only place it can be proven
- Write one component test per acceptance criterion in the governing spec, black box through HTTP with the real module and real database wired. These are the tests that would catch a status code the whole stack never actually produces, which no amount of mocked-boundary testing can
- Keep fixtures/fakes under `test/fixtures` and reuse them
- Assert the **specific** typed error, not a generic throw
- Let the integration suite own its database: start it from the suite, publish its connection string through the environment, and apply migrations once per run, so a run carries no manual precondition
- Start **one database per run**, not per test or per file. Startup costs seconds, so per-test would dominate the suite and per-file multiplies containers across parallel workers
- Isolate with a truncate before each test. Rolled-back-transaction isolation is faster but only works when the test controls the transaction — code that opens its own (a `TransactionProvider`) or asserts real commit behaviour (optimistic locking) needs genuine commits

**DON'T:**
- Don't test framework internals or getters/setters
- Don't over-mock — mocking the thing under test proves nothing
- Don't mock the database for repository tests; assert round-trip mapping and optimistic locking against the real engine
- Don't leave stray scratch notes or dead code in test files
- Don't share mutable state between tests; reset mocks per test
- Don't leave a running database as an unenforced precondition. Forgetting the compose command then surfaces as a raw driver connection error rather than a usable message — have the suite start what it needs, or fail fast with an instruction

## TypeScript Specifics
- Cast minimal fakes with `as` only at the boundary (`work({} as Transaction)`); prefer a typed fake class implementing the port otherwise.
- Reset mocks between tests (`jest.clearAllMocks()` in `afterEach`, or `clearMocks: true` in jest config) to avoid leakage across `it` blocks that share a mock object.
- Assert the concrete error class, not its message: `await expect(promise).rejects.toThrow(LockerNotFoundError)`.
- Name tests as sentences via `it('should ...')`, one behaviour each, so a failure report reads as a list of broken promises.
- Start the database with `@testcontainers/postgresql` from Jest's `globalSetup`, and stop it in `globalTeardown`. Jest propagates `process.env` from `globalSetup` into test workers, so publish the generated connection string as `DATABASE_URL` there. Keep the container handle on `globalThis` — setup and teardown are separate modules with no guaranteed shared registry.
- Keep `globalSetup` and its imports on relative paths. `moduleNameMapper` is not reliably applied to setup scripts, so an `@/`-aliased import there fails to resolve.

## NestJS Specifics
- Build the module under test with `Test.createTestingModule({...}).compile()`, then `module.createNestApplication()` + `await app.init()`; always `await app.close()` in `afterEach`.
- Replace real providers with test doubles via `useValue` (or `.overrideProvider(Token).useValue(...)`).
- Drive HTTP with `supertest`: `request(app.getHttpServer()).patch('/lockers/:id/lock').send({...}).expect(204)`.
- To test global behavior (validation pipe, exception filter), register the same global providers in the testing module so the request path matches production.
- Prove filter mapping by throwing the domain error from a mocked use-case and asserting the mapped status and body over `supertest`. This is the answer to "how do I test exceptions like in Spring": go through the HTTP boundary rather than calling the filter directly.
