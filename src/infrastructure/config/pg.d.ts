// Stopgap: `pg` ships no types and `@types/pg` cannot be installed while the registry token is
// expired. Replace this with `pnpm add -D @types/pg` once auth is restored.
declare module 'pg';
