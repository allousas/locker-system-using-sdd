import {Module} from '@nestjs/common';
import {HealthController} from '@/infrastructure/inbound/health.controller';
import {LockUseCase} from "@/application/use-cases/lock.use-case";
import {LockerController} from "@/infrastructure/inbound/locker.controller";
import {InMemoryDomainEventDispatcher} from "@/infrastructure/outbound/in-memory.domain-event-dispatcher";
import {InMemoryBusPublisherHandler, LoggingDomainEventHandler} from "@/infrastructure/outbound/domain-event.handlers";
import {InMemoryEventBus} from "@/infrastructure/outbound/in-memory.event-bus";
import {DomainEventPublisher, LockerRepository, TransactionProvider} from "@/domain/outbound.ports";
import {APP_FILTER} from "@nestjs/core";
import {DomainExceptionFilter, GlobalExceptionFilter} from "@/infrastructure/inbound/exception.filters";
import {PostgresLockerRepository} from "@/infrastructure/outbound/postgres.locker-repository";
import {KyselyTransactionProvider} from "@/infrastructure/outbound/kysely.transaction-provider";
import {DatabaseConnection, kyselyProvider} from "@/infrastructure/config/database.providers";

@Module({
    controllers: [
        HealthController,
        LockerController
    ],
    providers: [
        LockUseCase,
        LoggingDomainEventHandler,
        InMemoryBusPublisherHandler,
        InMemoryEventBus,
        kyselyProvider,
        DatabaseConnection,
        {
            provide: LockerRepository,
            useClass: PostgresLockerRepository,
        },
        {
            provide: TransactionProvider,
            useClass: KyselyTransactionProvider,
        },
        {
            provide: DomainEventPublisher,
            useClass: InMemoryDomainEventDispatcher,
        },
        {
            provide: APP_FILTER,
            useClass: DomainExceptionFilter,
        },
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
    ],
})
export class AppModule {
}
