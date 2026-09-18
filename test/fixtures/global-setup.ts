import {startPostgres} from './postgres.container';

/**
 * Starts the database once for the whole integration run and publishes its connection string as
 * `DATABASE_URL`, which Jest propagates to the test workers. Migrations stay in the suite's own
 * `beforeAll` so the dbmate execution path is unchanged.
 *
 * Set `DATABASE_URL` yourself to run against an already-running Postgres — a CI service container,
 * or the local `pnpm db:up` one — and no container is started.
 *
 * Imports nothing `@/`-aliased on purpose: Jest does not reliably apply `moduleNameMapper` to
 * globalSetup, so this module and its dependencies stay on relative paths.
 */
module.exports = async function globalSetup(): Promise<void> {
    if (process.env.DATABASE_URL) return;

    process.env.DATABASE_URL = await startPostgres();
};
