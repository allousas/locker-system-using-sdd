import {LockUseCase} from '@/application/use-cases/lock.use-case';
import {Code, Locker} from "@/domain/locker.domain";
import {FakeTransactionProvider} from "../../fixtures/FakeTransactionProvider";
import {LockerNotFoundError} from "@/domain/locker.errors";
import {LockerLockedEvent} from "@/domain/locker.events";

describe('LockUseCase', () => {

    const lockerRepository = {
        find: jest.fn(),
        save: jest.fn(),
    };

    const domainEventPublisher = {
        publish: jest.fn(),
    }

    const lockUseCase = new LockUseCase(lockerRepository, new FakeTransactionProvider(), domainEventPublisher);

    it('should lock a locker', async () => {
        let locker = new Locker('550e8400-e29b-41d4-a716-446655440000', Code.reconstitute('1234'), 'unlocked', 1);
        lockerRepository.find.mockResolvedValue(locker);

        await lockUseCase.execute('550e8400-e29b-41d4-a716-446655440000', '1234');

        expect(lockerRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'locked' }),
            expect.anything(),
        )
        expect(domainEventPublisher.publish).toHaveBeenCalledWith(expect.any(LockerLockedEvent), expect.anything());
    });

    it('should fail locking a locker when it is not found', async () => {
        lockerRepository.find.mockResolvedValue(null);

        await expect(async () => await lockUseCase.execute('550e8400-e29b-41d4-a716-446655440000', '1234')).
            rejects.toThrow(LockerNotFoundError);
    });
});
