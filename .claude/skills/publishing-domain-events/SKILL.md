---
name: publishing-domain-events
description: Domain event publishing expert (DomainEventPublisher, in-memory dispatcher, in-process handlers, and the path from there to reliable broker delivery). ALWAYS invoke this skill when the user asks about domain events, event publishing, event dispatchers or handlers, metrics on events, reliable event publishing, the dual-write problem, the transactional outbox, an outbox poller/relay, or publishing to Kafka after a state change. Do not attempt to write event publishing code directly — use this skill first.
---

## Purpose
Publish domain events after state changes to notify other parts of the system, keeping the domain decoupled from messaging infrastructure. Covers who emits events, how they reach handlers, and how far to take delivery.

## Shape
```
DomainEventPublisher  <──implements──  InMemoryDomainEventDispatcher
   (domain port)                                │  -- calls each handler, never acts itself
   use case depends on this                     ├──> LoggingDomainEventHandler       -- event type + ids, never the code
                                                └──> InMemoryBusPublisherHandler     -- re-publish in-process, other modules react
```

## Flow
1. Use case executes the domain operation and persists the state change
2. Use case calls `domainEventPublisher.publish(event, trx)` **after** the state change, inside the same transaction
3. The dispatcher calls each injected handler in turn, **sequentially**
4. Each handler performs **one** side-effect; a failure fails `publish` and the transaction rolls back

## Guidelines

**DO:**
- Publish from the use case, after the state change succeeds, inside its transaction
- Give each side-effect its own handler class; co-locate them in one file, one `describe` block each in tests
- **Keep `transaction` on the `DomainEventPublisher` port** even while no handler uses it — that is the seam the outbox slots into, and the use case already has the handle
- Let a handler failure fail the whole `publish` so no side-effect is half-applied

**DON'T:**
- **Don't perform side-effects inside the dispatcher** — it calls handlers, handlers act. Collapsing both makes each untestable
- Don't add a handler interface, a `handles` predicate, or a registry until something actually varies at runtime — name the implementations and call them
- Don't give each handler its own file — that scatters the set of side-effects
- Don't publish from inside domain entities, or before the state change is persisted
- Don't use events for request/response, or for cross-service communication before the outbox exists
- Don't log the event wholesale — entities carry secrets (a locker's `code`). Identifiers and event type only
- Don't run handlers with `Promise.all` — concurrent use of one transaction handle is unsafe

## TypeScript Specifics
- Declare the publisher port as an `abstract class`, not an `interface`. It has to survive compilation to act as a DI token — an erased interface cannot (see `configuring-runtime-dependencies`).
- Have each event implement a shared `DomainEvent` interface and name the class in the past tense (`LockerLockedEvent`). Events are `readonly` data carriers with no behaviour; the tense is what stops them drifting into commands.
- Declare a handler function type as a type alias next to the class that consumes it, below it in the same file, rather than exporting it for reuse it may never get.
- Dispatch with a sequential `for...of` and `await` each handler. `Promise.all` is not merely a style choice here — it types the same transaction handle into concurrent use, which the driver does not support.

## NestJS Specifics
- Inject handlers as **ordinary providers**, one constructor argument each — no `Symbol` token, no registry class, no interface
- Because the constructor names each handler, **adding one means editing the dispatcher too** — a constructor argument and a call in `publish`. Nothing fails at boot if you forget, so add its dispatch assertion in the same change
- Bind the port to the adapter in the module (`{provide: DomainEventPublisher, useClass: InMemoryDomainEventDispatcher}`) — see `configuring-runtime-dependencies`

## Growing up

**Metrics — for production readiness.** Add a `MetricsDomainEventHandler` once someone needs event rates (dashboards, alerting on a drop in lockings). 
**Outbox pattern + message broker(Kafka/Pulsar) — when production-ready or events must leave the service.** Add an `OutboxDomainEventHandler` when a real consumer outside this service needs the event, this would require implement reliable publishing with outbox pattern and a message streaming platform 

## Testing
- Dispatcher: spy on the injected handler; assert it receives the event and that a throwing handler propagates. With one handler wired, sequencing and short-circuit-on-failure are not observable — add those when the second arrives
- Handlers: unit-test each side-effect alone; assert no secret reaches logs or payloads
- Outbox stage only: integration-test against real Postgres and assert a **rolled-back transaction leaves no row** — the test that proves the pattern
