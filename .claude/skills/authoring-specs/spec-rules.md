# Spec Rules

## Template

Every spec file MUST follow this structure:

```markdown
---
feature: <name>
status: implemented/not-implemented
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
    Update `status` and `updated` on every change.
