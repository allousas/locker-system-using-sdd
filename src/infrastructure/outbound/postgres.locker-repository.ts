import {Kysely, Selectable} from "kysely";
import {Injectable} from "@nestjs/common";
import {LockerRepository, Transaction} from "@/domain/outbound.ports";
import {Code, Locker} from "@/domain/locker.domain";
import {OptimisticLockingException} from "@/infrastructure/infrastructure.errors";
import {activeTransaction, Database} from "@/infrastructure/outbound/database.schema";

type LockerRow = Selectable<Database['lockers']>;

@Injectable()
export class PostgresLockerRepository implements LockerRepository {

    constructor(private readonly db: Kysely<Database>) {}

    async find(lockerId: string): Promise<Locker | null> {
        const row = await this.db
            .selectFrom('lockers')
            .selectAll()
            .where('id', '=', lockerId)
            .executeTakeFirst();

        return row ? this.toLocker(row) : null;
    }

    async save(locker: Locker, transaction: Transaction): Promise<void> {
        const trx = activeTransaction(transaction, `Saving locker ${locker.id}`);

        const result = await trx
            .updateTable('lockers')
            .set({code: locker.code.value, status: locker.status, version: locker.version + 1})
            .where('id', '=', locker.id)
            .where('version', '=', locker.version)
            .executeTakeFirst();

        if (result.numUpdatedRows === 0n) throw new OptimisticLockingException('Locker', locker.id);
    }

    private toLocker(row: LockerRow): Locker {
        return new Locker(row.id, Code.reconstitute(row.code), row.status, row.version);
    }
}
