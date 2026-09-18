export abstract class InfrastructureException extends Error {
    protected constructor(message: string, public readonly cause?: unknown) {
        super(message);
        this.name = new.target.name;
    }
}

export class OptimisticLockingException extends InfrastructureException {
    constructor(entity: string, id: string, cause?: unknown) {
        super(`Concurrent update of ${entity} ${id}`, cause);
    }
}

export class TransactionNotActiveException extends InfrastructureException {
    constructor(operation: string) {
        super(`${operation} requires an active transaction`);
    }
}
