export abstract class DomainException extends Error {
    protected constructor(message: string) {
        super(message);
        this.name = new.target.name;
    }
}

export class LockerNotFoundError extends DomainException {
    constructor(lockerId: string) {
        super(`Locker with id ${lockerId} not found`);
    }
}

export class LockerAlreadyLockedError extends DomainException {
    constructor(lockerId: string) {
        super(`Locker with id ${lockerId} already locked`);
    }
}

export enum InvalidCodeReason {
    INVALID_LENGTH = 'INVALID_LENGTH',
    INVALID_CHARACTERS = 'INVALID_CHARACTERS',
}

export class InvalidCodeError extends DomainException {
    constructor(public readonly reason: InvalidCodeReason) {
        super(`Invalid code: ${reason}`);
    }
}
