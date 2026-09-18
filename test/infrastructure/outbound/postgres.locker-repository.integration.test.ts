import {Kysely, PostgresDialect} from 'kysely';
import {Pool} from 'pg';
import {PostgresLockerRepository} from '@/infrastructure/outbound/postgres.locker-repository';
import {KyselyTransactionProvider} from '@/infrastructure/outbound/kysely.transaction-provider';
import {Database} from '@/infrastructure/outbound/database.schema';
import {DEFAULT_DATABASE_URL} from '@/infrastructure/config/database.providers';
import {Code, Locker} from '@/domain/locker.domain';
import {Transaction} from '@/domain/outbound.ports';
import {OptimisticLockingException, TransactionNotActiveException} from '@/infrastructure/infrastructure.errors';
import {migrate} from '../../fixtures/migrate';

describe('PostgresLockerRepository', () => {

    const lockerId = '550e8400-e29b-41d4-a716-446655440000';

    let db: Kysely<Database>;
    let repository: PostgresLockerRepository;
    let transactionProvider: KyselyTransactionProvider;

    beforeAll(async () => {
        db = new Kysely<Database>({
            dialect: new PostgresDialect({
                pool: new Pool({connectionString: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL}),
            }),
        });
        repository = new PostgresLockerRepository(db);
        transactionProvider = new KyselyTransactionProvider(db);

        await migrate();
    });

    afterAll(async () => {
        await db.destroy();
    });

    beforeEach(async () => {
        await db.deleteFrom('lockers').execute();
        await db.insertInto('lockers')
            .values({id: lockerId, code: '0000', status: 'unlocked', version: 1})
            .execute();
    });

    const findStoredLocker = async (): Promise<Locker> => {
        const locker = await repository.find(lockerId);

        if (!locker) throw new Error(`locker ${lockerId} is not stored`);

        return locker;
    };

    it('should find a stored locker', async () => {
        const locker = await repository.find(lockerId);

        expect(locker).toEqual(new Locker(lockerId, Code.reconstitute('0000'), 'unlocked', 1));
    });

    it('should return null for an unknown locker', async () => {
        expect(await repository.find('11111111-1111-1111-1111-111111111111')).toBeNull();
    });

    it('should persist the status and code', async () => {
        await transactionProvider.run((trx) =>
            repository.save(new Locker(lockerId, Code.reconstitute('1234'), 'locked', 1), trx));

        const stored = await findStoredLocker();

        expect(stored.status).toBe('locked');
        expect(stored.code).toEqual(Code.reconstitute('1234'));
    });

    it('should advance the version at save time', async () => {
        const loaded = await findStoredLocker();

        await transactionProvider.run((trx) => repository.save(loaded.lock('1234'), trx));

        expect((await findStoredLocker()).version).toBe(loaded.version + 1);
    });

    it('should advance the version on every save', async () => {
        const loaded = await findStoredLocker();
        await transactionProvider.run((trx) => repository.save(loaded.lock('1234'), trx));

        const locked = await findStoredLocker();
        await transactionProvider.run((trx) => repository.save(locked, trx));

        expect((await findStoredLocker()).version).toBe(loaded.version + 2);
    });

    it('should leave no change when the transaction rolls back', async () => {
        const failing = transactionProvider.run(async (trx) => {
            await repository.save(new Locker(lockerId, Code.reconstitute('1234'), 'locked', 1), trx);
            throw new Error('later step blew up');
        });

        await expect(failing).rejects.toThrow('later step blew up');

        expect(await repository.find(lockerId))
            .toEqual(new Locker(lockerId, Code.reconstitute('0000'), 'unlocked', 1));
    });

    it('should reject a save whose version is no longer the stored one', async () => {
        const stale = new Locker(lockerId, Code.reconstitute('1234'), 'locked', 5);

        await expect(transactionProvider.run((trx) => repository.save(stale, trx)))
            .rejects.toThrow(OptimisticLockingException);
    });

    it('should not advance the version when the save is rejected', async () => {
        const stale = new Locker(lockerId, Code.reconstitute('1234'), 'locked', 5);

        await expect(transactionProvider.run((trx) => repository.save(stale, trx)))
            .rejects.toThrow(OptimisticLockingException);

        expect(await repository.find(lockerId))
            .toEqual(new Locker(lockerId, Code.reconstitute('0000'), 'unlocked', 1));
    });

    it('should reject a concurrent second write of the same version', async () => {
        const locked = new Locker(lockerId, Code.reconstitute('1234'), 'locked', 1);
        await transactionProvider.run((trx) => repository.save(locked, trx));

        await expect(transactionProvider.run((trx) => repository.save(locked, trx)))
            .rejects.toThrow(OptimisticLockingException);
    });

    it('should refuse to save outside an active transaction', async () => {
        const locker = new Locker(lockerId, Code.reconstitute('1234'), 'locked', 1);

        await expect(repository.save(locker, {} as Transaction))
            .rejects.toThrow(TransactionNotActiveException);
    });
});
