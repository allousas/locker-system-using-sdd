import {Locker} from "@/domain/locker.domain";

export interface DomainEvent {
    locker: Locker;
}

export class LockerLockedEvent implements DomainEvent{
    constructor(
        public readonly locker: Locker,
    ) {}
}