# Locker system using spec driven development

A small locker service — lock and unlock resources with a 4-digit code — that exists mainly as a
test for **my own take on spec driven development** ([spec anchored version](https://www.rushis.com/spec-first-spec-anchored-spec-as-truth-the-three-levels-of-spec-driven-development/)), where the spec is a living artifact that evolves with the system and is mechanically enforced against the code.
Second motive: getting up to speed with TypeScript. I'm not an expert in the language — this is me
pairing with Claude, so treat the code as a work in progress rather than a reference.

[sdd]: https://www.rushis.com/spec-first-spec-anchored-spec-as-truth-the-three-levels-of-spec-driven-development/

## AI guardrails

Three layers, each answering a different question:

- **CLAUDE.md** — *what rules apply everywhere?* Architecture, conventions, terminology. Always loaded.
- **Specs** (`docs/specs/`) — *what must be built, and what must be true?* Requirements, invariants, acceptance criteria. Technology-agnostic: outcomes, not implementation.
- **Skills** (`.claude/skills/`) — *how is this kind of component built here?* Reusable expertise, loaded only when relevant. 

```
CLAUDE.md   →  project-wide architecture, constraints, conventions
    ↓
Specs       →  what needs building and what must hold
    ↓
Skills      →  reusable expertise for executing the task
    ↓
Code        →  the implementation
```

## How spec driven development is enforced

Three skills gate the work, split by **which artifact changed**:

- **`validating-changes-against-specs`** — fires on **implementing, planning or reviewing** any code,
  feature or behaviour change. Resolves the governing spec and validates the change against its
  requirements and acceptance criteria. *Refuses to proceed when no spec covers the change.*
- **`authoring-specs`** — fires when a spec is **missing or stale**. Interviews for the missing details
  and writes `docs/specs/<feature>.md` to a fixed template. User-invocable only, so specs are never
  authored behind your back.
- **`detecting-spec-drift`** — fires when a **spec** changed. Walks outward from the spec to the code it
  governs and reports drift, classified as Missing / Undeclared / Contradictory / Untested / Stale
  metadata.

The pair matters: the first catches code that outruns its spec, the third catches specs that outrun
their code. Without both, drift only surfaces by accident.

The nine remaining skills are building blocks — controllers, use-cases, repositories, rich domain ...

## Try it

Open Claude and ask for a feature that has no spec yet:

```
implement unlock locker
```

That refusal is the whole point of the setup.
