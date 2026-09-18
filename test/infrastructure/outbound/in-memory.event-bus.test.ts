import {InMemoryEventBus} from '@/infrastructure/outbound/in-memory.event-bus';
import {Code, Locker} from '@/domain/locker.domain';
import {DomainEvent, LockerLockedEvent} from '@/domain/locker.events';

describe('InMemoryEventBus', () => {

    const locker = new Locker('550e8400-e29b-41d4-a716-446655440000', Code.reconstitute('1234'), 'locked', 2);
    const event = new LockerLockedEvent(locker);

    let bus: InMemoryEventBus;

    beforeEach(() => {
        bus = new InMemoryEventBus();
    });

    it('should publish without listeners', async () => {
        await expect(bus.publish(event)).resolves.toBeUndefined();
    });

    it('should deliver the event to a subscribed listener', async () => {
        const received: DomainEvent[] = [];
        bus.subscribe(async (published) => {
            received.push(published);
        });

        await bus.publish(event);

        expect(received).toEqual([event]);
    });

    it('should deliver to every listener in subscription order', async () => {
        const order: string[] = [];
        bus.subscribe(async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            order.push('first');
        });
        bus.subscribe(async () => {
            order.push('second');
        });

        await bus.publish(event);

        expect(order).toEqual(['first', 'second']);
    });

    it('should propagate a listener failure so the caller transaction rolls back', async () => {
        bus.subscribe(async () => {
            throw new Error('listener blew up');
        });

        await expect(bus.publish(event)).rejects.toThrow('listener blew up');
    });

    it('should not deliver to later listeners once one fails', async () => {
        const received: DomainEvent[] = [];
        bus.subscribe(async () => {
            throw new Error('listener blew up');
        });
        bus.subscribe(async (published) => {
            received.push(published);
        });

        await expect(bus.publish(event)).rejects.toThrow('listener blew up');

        expect(received).toEqual([]);
    });
});
