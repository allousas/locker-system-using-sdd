---
name: implementing-rich-domain
description: Rich domain model expert (entities, value objects, aggregates, domain errors, domain events). ALWAYS invoke this skill when the user asks about domain models, entities, value objects, aggregates, business rules, invariants, or any code that lives in the domain layer. Do not attempt to write or modify domain code directly — use this skill first.
---

## Purpose
The domain layer is the heart of the system. It owns the business rules and the state they protect. A *rich* domain model keeps state and behavior together so invariants cannot be bypassed by callers, and so use cases stay free of business logic.

## Building blocks
- **Entity** — has identity and a lifecycle. Equality by id. Behavior changes its state through methods.
- **Value Object** — no identity. Equality by value. Immutable. Used to make implicit concepts explicit.
- **Aggregate** — a cluster of entities/value objects with one root entity as the only entry point. The root enforces invariants for the whole cluster and is the unit of persistence.
- **Domain Error** — typed error expressing a violated invariant. Throw or returned from the entity, never return/throw generic errors/exceptions.
- **Domain Event** — past-tense fact that something happened (e.g. `TeamCreatedEvent`).
- **Factory** — a function or class responsible for creating complex entities or aggregates, especially when creation involves accessing to infrastructure or other aggregates. They should live in the application layer, not the domain layer, to avoid coupling the domain to infrastructure.

## Flow
1. An entity enters existence either freshly created through a constructor/factory that validates its inputs, or rehydrated from persistence
2. The caller invokes a verb method naming the business action (`lock`, `unlock`)
3. That method checks the invariant guarding the action
4. On violation it throws a typed domain error; otherwise it returns a **new instance** carrying the new state
5. The use case decides what to do with that instance — persist it, publish the resulting event

The entity never reaches outward in step 5. It reports what happened; the use case acts on it.

## Guidelines

**DO:**
- Code around aggregates by enforcing that all business state mutations, invariant checks, and domain rules occur through the Aggregate Root using explicit action verbs whenever possible. 
- Put business rules **inside** the entity method that performs the action — never in the use case, controller or repository.
- Make state changes return a **new instance**, enforce immutability.
- Validate inputs in constructors / factory methods so an instance cannot exist in an invalid state.
- Throw or return a **typed domain error** when an invariant is violated. The error name should describe the rule broken (`LockerAlreadyLockedError/Exception`).
- Use **value objects** only to wrap primitives that carry rules (a 4-digit `Code`). This pushes validation to the type and makes use-case signatures self-documenting.
- Express the action as a verb method (`lock`, `unlock`) — the method name is the ubiquitous language.
- Keep the domain layer **dependency-free**: no NestJS decorators, no Kysely, no KafkaJS, no logger, no `Date.now()` scattered around (inject clocks/id-generators as parameters when you need them).

**DON'T:**
- No Value Objects if not needed — don't wrap primitives for the sake of wrapping. If a string is sufficient, use a string. If you need validation or a specific concept, create a Value Object.
- No setters or public mutable fields — they let callers bypass invariants. Prefer methods that produce a new instance, or `readonly` fields.
- No infrastructure types/dependencies (DB rows, HTTP DTOs, Kafka messages) inside the domain.
- No repository or event-publisher calls from inside an entity. The entity decides *what happened*; the use case decides *what to do about it* (persist, publish).
- No framework annotations. The domain is free of infrastructure.
- No `null` returns to signal "rule violated" — throw a typed domain error so the failure is named.
- No generic events like `UserUpdatedEvent` that don't express the business meaning. If the event is important enough to publish, it's important enough to name.

## TypeScript Specifics
- Mark every field `readonly` and return a new instance from state changes. Immutability then holds by construction rather than by reviewer vigilance.
- Model a lifecycle state as a string-literal union (`'locked' | 'unlocked'`), not an enum or bare `string`. The compiler enforces exhaustiveness and the valid values are readable at the declaration.
- When creation must validate, make the constructor `private` and expose a named static factory. The type system then makes the invalid path unreachable, instead of merely discouraged:
  ```typescript
  export class Code {
    private constructor(public readonly value: string) {}

    static createFourDigitsCode(code: string): Code {
      if (!/^\d+$/.test(code)) throw new InvalidCodeError(InvalidCodeReason.INVALID_CHARACTERS);
      if (code.length !== 4) throw new InvalidCodeError(InvalidCodeReason.INVALID_LENGTH);
      return new Code(code);
    }

    static reconstitute(value: string): Code {
      return new Code(value);
    }
  }
  ```
- Keep creation and rehydration as separate named entry points, as above. Data already in the database has passed validation once; re-running it on every read means a rule change retroactively makes stored rows unloadable.

## NestJS Specifics
None — deliberately. The domain layer carries no `@Injectable()`, no decorators, and no imports from `@nestjs/*`. It is instantiated by use-cases and adapters, never by the DI container, which is what keeps it testable without a framework and portable if the framework changes. Wiring belongs in `configuring-runtime-dependencies`.
