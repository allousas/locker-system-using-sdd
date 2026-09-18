import {Kysely} from "kysely";
import {Injectable} from "@nestjs/common";
import {Transaction, TransactionProvider} from "@/domain/outbound.ports";
import {Database, KyselyTransaction} from "@/infrastructure/outbound/database.schema";

/**
 * Opens the single transaction a use case runs in. Kysely commits when `work` resolves and rolls back
 * when it throws, so a failing repository write or event handler discards the whole unit of work.
 */
@Injectable()
export class KyselyTransactionProvider implements TransactionProvider {

    constructor(private readonly db: Kysely<Database>) {}

    run<T>(work: (trx: Transaction) => Promise<T>): Promise<T> {
        return this.db.transaction().execute((trx) => work({trx} satisfies KyselyTransaction));
    }
}
