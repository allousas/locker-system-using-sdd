import {InMemoryDomainEventDispatcher} from '@/infrastructure/outbound/in-memory.domain-event-dispatcher';
import {InMemoryBusPublisherHandler, LoggingDomainEventHandler} from '@/infrastructure/outbound/domain-event.handlers';
import {InMemoryEventBus} from '@/infrastructure/outbound/in-memory.event-bus';
import {Code, Locker} from '@/domain/locker.domain';
import {LockerLockedEvent} from '@/domain/locker.events';

describe('InMemoryDomainEventDispatcher', () => {

    const locker = new Locker('550e8400-e29b-41d4-a716-446655440000', Code.reconstitute('1234'), 'locked', 2);
    const event = new LockerLockedEvent(locker);

    let logging: LoggingDomainEventHandler;
    let inMemoryBus: InMemoryBusPublisherHandler;
    let dispatcher: InMemoryDomainEventDispatcher;

    beforeEach(() => {
        logging = new LoggingDomainEventHandler();
        inMemoryBus = new InMemoryBusPublisherHandler(new InMemoryEventBus());
        dispatcher = new InMemoryDomainEventDispatcher(logging, inMemoryBus);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should dispatch the event to every handler', async () => {
        const log = jest.spyOn(logging, 'handle').mockImplementation();
        const bus = jest.spyOn(inMemoryBus, 'handle').mockImplementation();

        await dispatcher.publish(event);

        expect(log).toHaveBeenCalledWith(event);
        expect(bus).toHaveBeenCalledWith(event);
    });

    it('should await each handler before dispatching to the next', async () => {
        const order: string[] = [];
        jest.spyOn(logging, 'handle').mockImplementation(async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            order.push('logging');
        });
        jest.spyOn(inMemoryBus, 'handle').mockImplementation(async () => {
            order.push('bus');
        });

        await dispatcher.publish(event);

        expect(order).toEqual(['logging', 'bus']);
    });

    it('should propagate a handler failure so the caller transaction rolls back', async () => {
        jest.spyOn(logging, 'handle').mockRejectedValue(new Error('handler blew up'));

        await expect(dispatcher.publish(event)).rejects.toThrow('handler blew up');
    });

    it('should not dispatch to later handlers once one fails', async () => {
        jest.spyOn(logging, 'handle').mockRejectedValue(new Error('handler blew up'));
        const bus = jest.spyOn(inMemoryBus, 'handle').mockImplementation();

        await expect(dispatcher.publish(event)).rejects.toThrow('handler blew up');

        expect(bus).not.toHaveBeenCalled();
    });
});
