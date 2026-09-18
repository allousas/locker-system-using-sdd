import {Transaction, TransactionProvider} from "@/domain/outbound.ports";

export class FakeTransactionProvider implements TransactionProvider {
    run<T>(work: (trx: Transaction) => Promise<T>): Promise<T> {
        return work({} as Transaction);
    }
}
