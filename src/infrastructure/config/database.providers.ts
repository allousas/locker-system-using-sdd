import {Kysely, PostgresDialect} from "kysely";
import {Pool} from "pg";
import {BeforeApplicationShutdown, Injectable, Provider} from "@nestjs/common";
import {Database} from "@/infrastructure/outbound/database.schema";

export const DEFAULT_DATABASE_URL = 'postgres://locker:locker@localhost:5433/locker';

/**
 * `new Pool` does not connect until the first query, so building this provider never blocks startup
 * on a reachable database.
 */
export const kyselyProvider: Provider = {
    provide: Kysely,
    useFactory: () => new Kysely<Database>({
        dialect: new PostgresDialect({
            pool: new Pool({connectionString: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL}),
        }),
    }),
};

/**
 * Closes the pool on shutdown; without it the process hangs on open connections.
 * Requires `app.enableShutdownHooks()` in `main.ts`.
 */
@Injectable()
export class DatabaseConnection implements BeforeApplicationShutdown {

    constructor(private readonly db: Kysely<Database>) {}

    async beforeApplicationShutdown(): Promise<void> {
        await this.db.destroy();
    }
}
