import {InMemoryBusPublisherHandler, LoggingDomainEventHandler} from '@/infrastructure/outbound/domain-event.handlers';
import {InMemoryEventBus} from '@/infrastructure/outbound/in-memory.event-bus';
import {Code, Locker} from '@/domain/locker.domain';
import {DomainEvent, LockerLockedEvent} from '@/domain/locker.events';
import {Logger} from '@nestjs/common';

const lockerId = '550e8400-e29b-41d4-a716-446655440000';
const locker = new Locker(lockerId, Code.reconstitute('1234'), 'locked', 2);

describe('LoggingDomainEventHandler', () => {

    let log: jest.SpyInstance;

    beforeEach(() => {
        log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    });

    afterEach(() => {
        log.mockRestore();
    });

    it('should log the event type, locker id and status', async () => {
        await new LoggingDomainEventHandler().handle(new LockerLockedEvent(locker));

        expect(log).toHaveBeenCalledWith(
            `Domain event published: LockerLockedEvent locker=${lockerId} status=locked`,
        );
    });

    it('should not log the locker security code', async () => {
        await new LoggingDomainEventHandler().handle(new LockerLockedEvent(locker));

        log.mock.calls.forEach(([message]) => expect(String(message)).not.toContain('1234'));
    });
});

describe('InMemoryBusPublisherHandler', () => {

    let bus: InMemoryEventBus;
    let handler: InMemoryBusPublisherHandler;

    beforeEach(() => {
        bus = new InMemoryEventBus();
        handler = new InMemoryBusPublisherHandler(bus);
    });

    it('should re-publish the event on the bus', async () => {
        const received: DomainEvent[] = [];
        bus.subscribe(async (published) => {
            received.push(published);
        });
        const event = new LockerLockedEvent(locker);

        await handler.handle(event);

        expect(received).toEqual([event]);
    });

    it('should propagate a listener failure so the caller transaction rolls back', async () => {
        bus.subscribe(async () => {
            throw new Error('listener blew up');
        });

        await expect(handler.handle(new LockerLockedEvent(locker))).rejects.toThrow('listener blew up');
    });
});
