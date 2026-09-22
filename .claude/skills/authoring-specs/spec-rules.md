# Spec Rules

## Template

Every spec file MUST follow this structure:

```markdown
---
feature: <name>
status: not-implemented/partially-implemented/implemented
updated: <ts> 
---

### Functional Requirements
- The system shall ...
- The user can ...
- The API returns ...

### Non-functional Requirements (optional)
- Any non-functional requirements relevant to the feature (performance, security, reliability, etc.)

### Contracts

#### Inbound Interfaces (if applicable)
> How the system is triggered

| Type (HTTP/Event/Job) | Source | Endpoint/Event | Input | Notes |
|-----------------------|--------|----------------|--------|------|

#### Outbound Interactions (if applicable)
> Side effects produced by the system

| Type (HTTP/DB/Event/Queue) | Target | Purpose | Contract | Notes |
|----------------------------|--------|----------|----------|------|

#### Data (if applicable)
> State the system owns, only relevant fields, skip ids etc ... unless relevant

| Field | Type | Nullability | Notes |
|-------|------|-------------|------|

### Rules / Constraints
- Business rules
- Validations
- Edge cases (nulls, fallbacks, limits)
- Ordering, idempotency, consistency constraints

### External Dependencies (optional)
- Services, systems, or infra this feature relies on
- SLA assumptions, versioning, reliability notes

### Acceptance Criteria
- [ ] Given X, when Y, then Z
- [ ] Handles edge case ...
- [ ] Fails with ... when ...

### Notes (optional)
- Implementation hints (high-level only, no code)
- Architectural decisions (if relevant)
- Related features
- Out of scope
- Any non-functional
```

## Rules

1. **Concise and short.**  
   Keep it under ~100 lines. Remove anything that doesn’t affect a decision.
2. **Describe *what* and *why*, not low-level *how*.**
    - ❌ No code, no framework/library details
    - ✅ High-level architectural decisions allowed (e.g., sync vs async, storage type)
3. **Model the system as a boundary.**
    - Inbound = what triggers it (HTTP, events, jobs)
    - Outbound = all side effects (DB, events, external calls, queues)
    - Data = system-owned state only
4. **Contracts must be explicit and structured.**  
   Use tables for all interfaces (APIs, events, interactions, schemas).
5. **Data Schema is high-level only.**  
   Include fields, types, nullability, relationships.  
   Exclude ORM details, persistence logic, and code structures.
6. **Outbound includes all side effects.**  
   Any interaction outside the system boundary must be defined.
7. **One feature per spec.**  
   A feature = independently testable or deployable unit.
8. **Edge cases are explicit.**  
   Nulls, fallbacks, retries, limits, and failure modes must be listed.
9. **Acceptance criteria are testable.**  
   Each checkbox represents one verifiable behavior.
10. **Status must reflect reality.**  
    Update `status` and `updated` on every change. All three measure the same thing — how much of the spec the code satisfies. The spec text is always the authority; `status` says how far the code has got:

    | Status | Meaning |
    |--------|---------|
    | `not-implemented` | No code implements this feature yet |
    | `partially-implemented` | The code satisfies some but not all of it; see the `### Notes` deltas |
    | `implemented` | The code satisfies every requirement, rule and acceptance criterion |

11. **A spec change made because something was missing lands as `partially-implemented`.**  
    When a gap in a spec is found — a rule never written down, a contract that disagrees with reality, a decision left open — write the correct behaviour into the spec **now**. Do not leave the change as a note describing what someone should eventually do: the spec body is what readers and the other skills act on, and a deferred edit is indistinguishable from an unnoticed gap.

    Then set `status: partially-implemented` and list the outstanding deltas under `### Notes`, one line each, so it is clear *which* parts are not yet real. The status stays until the code catches up, at which point it flips to `implemented` and the delta lines are deleted.

    The exception: when the code already does the right thing and only the spec text lagged, the edit brings the spec *back* into agreement with reality — that is not a pending delta, and `status` stays `implemented`.

12. **A spec change that reaches into another spec must edit that spec too.**  
    If a change alters state, a contract or a decision that a different spec governs, open that spec and apply the change in the same pass, following rule 11 for its status. Never describe the cross-spec edit in the new spec as though it were already done — write it, or say plainly that it is outstanding.
