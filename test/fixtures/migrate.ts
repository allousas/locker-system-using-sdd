import {execFile} from 'child_process';
import {join} from 'path';
import {promisify} from 'util';
import {DEFAULT_DATABASE_URL} from '@/infrastructure/config/database.providers';

const run = promisify(execFile);
const MIGRATIONS_DIR = join(__dirname, '../../db/migrations');

/**
 * Applies pending migrations with the real dbmate binary, so the tests and `pnpm db:migrate` share one
 * execution path. Requires dbmate on the PATH (`brew install dbmate`).
 *
 * Only *pending* migrations run — dbmate records applied ones in `schema_migrations`. Editing a
 * migration that already ran therefore has no effect here until `pnpm db:rollback`.
 */
export async function migrate(): Promise<void> {
    await run('dbmate', ['--migrations-dir', MIGRATIONS_DIR, '--no-dump-schema', 'up'], {
        env: {...process.env, DATABASE_URL: databaseUrl()},
    });
}

// dbmate refuses to connect to the local container unless SSL is explicitly disabled.
function databaseUrl(): string {
    const url = new URL(process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL);

    if (!url.searchParams.has('sslmode')) url.searchParams.set('sslmode', 'disable');

    return url.toString();
}
