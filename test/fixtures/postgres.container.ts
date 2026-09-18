import {PostgreSqlContainer, StartedPostgreSqlContainer} from '@testcontainers/postgresql';

/**
 * The Postgres the integration suite runs against, started once per run. The image matches
 * `docker-compose.yml` so tests and `pnpm start:dev` exercise the same server version.
 *
 * `globalSetup` and `globalTeardown` are separate modules, so the handle travels on `globalThis`
 * rather than in module scope — Jest does not guarantee they share a module registry.
 */
type ContainerHolder = {__lockerPostgresContainer?: StartedPostgreSqlContainer};

const holder = (): ContainerHolder => globalThis as unknown as ContainerHolder;

export async function startPostgres(): Promise<string> {
    const container = await new PostgreSqlContainer('postgres:16-alpine')
        .withDatabase('locker')
        .withUsername('locker')
        .withPassword('locker')
        .start();

    holder().__lockerPostgresContainer = container;

    return container.getConnectionUri();
}

export async function stopPostgres(): Promise<void> {
    await holder().__lockerPostgresContainer?.stop();

    holder().__lockerPostgresContainer = undefined;
}
