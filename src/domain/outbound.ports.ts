import {Locker} from "@/domain/locker.domain";
import {DomainEvent} from "@/domain/locker.events";

export abstract class LockerRepository {
    abstract find(lockerId: string): Promise<Locker | null>;
    abstract save(locker: Locker, transaction: Transaction): Promise<void>;
}

export abstract class TransactionProvider {
    abstract run<T>(work: (trx: Transaction) => Promise<T>): Promise<T>;
}

export interface Transaction {}

export abstract class DomainEventPublisher {
    abstract publish(event: DomainEvent, transaction: Transaction): Promise<void>;
}
