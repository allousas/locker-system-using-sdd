import {Kysely} from "kysely";
import {Transaction} from "@/domain/outbound.ports";
import {TransactionNotActiveException} from "@/infrastructure/infrastructure.errors";

interface LockersTable {
    id: string;
    code: string;
    status: 'locked' | 'unlocked';
    version: number;
}

export interface Database {
    lockers: LockersTable;
}

export interface KyselyTransaction extends Transaction {
    readonly trx: Kysely<Database>;
}

export function activeTransaction(transaction: Transaction, operation: string): Kysely<Database> {
    const {trx} = (transaction ?? {}) as Partial<KyselyTransaction>;

    if (trx?.isTransaction !== true) throw new TransactionNotActiveException(operation);

    return trx;
}
