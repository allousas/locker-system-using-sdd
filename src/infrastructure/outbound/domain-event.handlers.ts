import {DomainEvent} from "@/domain/locker.events";
import {Injectable, Logger} from "@nestjs/common";
import {InMemoryEventBus} from "@/infrastructure/outbound/in-memory.event-bus";

@Injectable()
export class LoggingDomainEventHandler {

    private readonly logger = new Logger(LoggingDomainEventHandler.name);

    async handle(event: DomainEvent): Promise<void> {
        this.logger.log(
            `Domain event published: ${event.constructor.name} locker=${event.locker.id} status=${event.locker.status}`,
        );
    }
}

@Injectable()
export class InMemoryBusPublisherHandler {

    constructor(private readonly bus: InMemoryEventBus) {}

    async handle(event: DomainEvent): Promise<void> {
        await this.bus.publish(event);
    }
}
