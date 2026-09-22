---
feature: lock-locker
status: partially-implemented
updated: 2026-09-22
---

### Functional Requirements

1. The user can lock an unlocked locker by providing a 4-digit numeric code.
2. The system shall persist the code and transition the locker status from `unlocked` to `locked`.
3. The system shall reject the request if the locker is already locked (409 Conflict).
4. The system shall reject the request if the locker does not exist (404 Not Found).
5. The system shall validate the code is exactly 4 digits (0000–9999).
6. The system shall publish a LockerLocked domain event upon successfully locking a locker.

### Contracts

#### Inbound Interfaces

| Type | Source | Endpoint | Input | Notes |
|------|--------|----------|-------|-------|
| HTTP | Client | `PATCH /lockers/:id/lock` | `{ code: string }` | code is a 4-digit string |

#### Outbound Interactions

| Type  | Target        | Purpose | Contract | Notes                                    |
|-------|---------------|---------|----------|------------------------------------------|
| DB    | lockers table | Persist status + code | UPDATE status, code WHERE id | Optimistic locking recommended           |
| Event | in-process event bus | Notify in-process handlers of the state change | LockerLocked domain event | Published inside the caller's transaction. Omit security code from payload |

Cross-service delivery (Kafka, via the transactional outbox) is **deferred** — no downstream consumer exists yet. When one does, add a broker-backed handler; FR6 and the acceptance criteria below are unaffected, since they require the event to be *published*, not brokered.

#### Data

| Field | Type | Nullability | Notes |
|-------|------|-------------|-------|
| code  | string, 4 digits | nullable | Set on lock; null whenever status is `unlocked` |

### Rules / Constraints

- Code must be exactly 4 characters, all digits (`/^\d{4}$/`).
- A locker can only be locked if its current status is `unlocked`.
- The code is not returned in the HTTP response body.
- A successful lock returns 204 No Content with no body.
- Locker starts in `unlocked` status upon creation, with a null code.

### Acceptance Criteria

- [x] Given an unlocked locker, when PATCH /lockers/:id/lock with valid 4-digit code, then status becomes `locked`, code is persisted, a LockerLocked event is published, and response is 204 No Content with no body.
- [ ] Given an unlocked locker, when PATCH /lockers/:id/lock with invalid code (non-4-digit), then response is 400 Bad Request.
- [ ] Given a locked locker, when PATCH /lockers/:id/lock, then response is 409 Conflict.
- [x] Given a non-existent locker id, when PATCH /lockers/:id/lock, then response is 404 Not Found.

### Notes

Outstanding deltas the code still owes this spec (`status: partially-implemented`):

- **`code` is not yet nullable.** The Data table above declares it nullable, since "no code set" is what an unlocked locker looks like; the migration still has `code TEXT NOT NULL` and seeds a placeholder code for unlocked lockers. A migration is owed.
- **400 and 409 are not delivered.** `DomainExceptionFilter` maps only `LockerNotFoundError`, so `InvalidCodeError` (FR5) and `LockerAlreadyLockedError` (FR3) both fall through to 500. The domain rules themselves are enforced; only the HTTP mapping is missing.
- **Error paths are untested.** The controller test mocks the use case and registers no exception filters, so no test exercises the mapping above.

Resolved 2026-09-22: the 200-vs-204 response question is settled as **204**, matching what the endpoint already returns.
