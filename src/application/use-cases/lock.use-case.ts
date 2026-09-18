import {Injectable} from '@nestjs/common';
import {DomainEventPublisher, LockerRepository, TransactionProvider} from "@/domain/outbound.ports";
import {LockerNotFoundError} from "@/domain/locker.errors";
import {LockerLockedEvent} from "@/domain/locker.events";

@Injectable()
export class LockUseCase {

    constructor(
        private readonly lockerRepository: LockerRepository,
        private readonly transactionProvider: TransactionProvider,
        private readonly domainEventPublisher: DomainEventPublisher,
    ) {
    }

    async execute(id: string, code: string): Promise<void> {
        await this.transactionProvider.run(async (trx) => {
            const locker = await this.lockerRepository.find(id);

            if (!locker) {
                throw new LockerNotFoundError(id);
            }

            const locked = locker.lock(code);

            await this.lockerRepository.save(locked, trx);
            await this.domainEventPublisher.publish(new LockerLockedEvent(locked), trx);
        })
    }
}
