import {stopPostgres} from './postgres.container';

/**
 * Stops the container started by globalSetup. A no-op when the run used an externally provided
 * `DATABASE_URL`, since nothing was started.
 */
module.exports = async function globalTeardown(): Promise<void> {
    await stopPostgres();
};
