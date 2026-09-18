import {DomainEvent} from "@/domain/locker.events";
import {Injectable} from "@nestjs/common";

/**
 * In-process pub/sub, so a module of this service can react to a domain event without the publisher
 * knowing it exists. Listeners run sequentially inside the caller's transaction and their failures
 * propagate, which keeps a broken reaction from committing a half-applied change.
 *
 * Nothing here survives a restart or reaches another service — that needs a broker-backed handler
 * (see the publishing-domain-events skill).
 */
@Injectable()
export class InMemoryEventBus {

    private listeners: ReadonlyArray<DomainEventListener> = [];

    subscribe(listener: DomainEventListener): void {
        this.listeners = [...this.listeners, listener];
    }

    async publish(event: DomainEvent): Promise<void> {
        for (const listener of this.listeners) {
            await listener(event);
        }
    }
}

export type DomainEventListener = (event: DomainEvent) => Promise<void>;