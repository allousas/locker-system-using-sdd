import {DomainEventPublisher} from "@/domain/outbound.ports";
import {DomainEvent} from "@/domain/locker.events";
import {Injectable} from "@nestjs/common";
import {InMemoryBusPublisherHandler, LoggingDomainEventHandler} from "@/infrastructure/outbound/domain-event.handlers";

/**
 * In-process event bus: handlers run sequentially inside the caller's transaction, so a failing
 * handler rolls the whole unit of work back. Nothing leaves the service — cross-service delivery
 * needs a broker-backed handler (see the publishing-domain-events skill).
 *
 * Handlers are named and called explicitly, so adding one is a constructor argument plus a line
 * below. A handler that only cares about some events returns early in its own `handle`.
 *
 * `DomainEventPublisher.publish` also carries the caller's `Transaction`; no handler needs it yet,
 * so it is not declared here. Take it as a second parameter once one does (an outbox write).
 */
@Injectable()
export class InMemoryDomainEventDispatcher implements DomainEventPublisher {

    constructor(
        private readonly logging: LoggingDomainEventHandler,
        private readonly inMemoryBus: InMemoryBusPublisherHandler,
    ) {}

    async publish(event: DomainEvent): Promise<void> {
        await this.logging.handle(event);
        await this.inMemoryBus.handle(event);
    }
}
