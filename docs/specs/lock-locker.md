---
feature: lock-locker
status: implemented
updated: 2026-09-16
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


### Rules / Constraints

- Code must be exactly 4 characters, all digits (`/^\d{4}$/`).
- A locker can only be locked if its current status is `unlocked`.
- The code is not returned in the HTTP response body.
- Locker starts in `unlocked` status upon creation.

### Acceptance Criteria

- [ ] Given an unlocked locker, when PATCH /lockers/:id/lock with valid 4-digit code, then status becomes `locked`, code is persisted, a LockerLocked event is published, and response is 200 with locker state (without code).
- [ ] Given an unlocked locker, when PATCH /lockers/:id/lock with invalid code (non-4-digit), then response is 400 Bad Request.
- [ ] Given a locked locker, when PATCH /lockers/:id/lock, then response is 409 Conflict.
- [x] Given a non-existent locker id, when PATCH /lockers/:id/lock, then response is 404 Not Found.

### Notes

Known gaps between this spec and the implementation, unresolved at the time of the 2026-09-16 vocabulary alignment:

- **Response shape undecided.** AC1 requires 200 with locker state; the endpoint returns 204 with no body. Whether the spec or the code changes is an open contract decision.
- **400 and 409 are not delivered.** `DomainExceptionFilter` maps only `LockerNotFoundError`, so `InvalidCodeError` (FR5) and `LockerAlreadyLockedError` (FR3) both fall through to 500. The domain rules themselves are enforced; only the HTTP mapping is missing.
- **Error paths are untested.** The controller test mocks the use case and registers no exception filters, so no test exercises the mapping above.
