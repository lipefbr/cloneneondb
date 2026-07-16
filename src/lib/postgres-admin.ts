import { Client } from 'pg';
import crypto from 'crypto';

/**
 * Postgres admin client - connects to the local Postgres server
 * as a superuser to provision databases and roles for users.
 *
 * Required env vars:
 * - PG_SUPERUSER_USER (default: postgres)
 * - PG_SUPERUSER_PASSWORD (required)
 * - PG_SUPERUSER_HOST (default: localhost)
 * - PG_SUPERUSER_PORT (default: 5432)
 * - PUBLIC_HOST (the public hostname/IP users will connect to)
 */

const PG_USER = process.env.PG_SUPERUSER_USER || 'postgres';
const PG_PASS = process.env.PG_SUPERUSER_PASSWORD || '';
const PG_HOST = process.env.PG_SUPERUSER_HOST || 'localhost';
const PG_PORT = parseInt(process.env.PG_SUPERUSER_PORT || '5432', 10);
const PUBLIC_HOST = process.env.PUBLIC_HOST || 'localhost';

if (!PG_PASS) {
  console.warn('[postgres-admin] PG_SUPERUSER_PASSWORD not set — database provisioning will fail.');
}

/**
 * Sanitize an id/name into a safe Postgres identifier (lowercase, alnum, underscore)
 */
export function sanitizeId(input: string): string {
  const cleaned = input.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24);
  return cleaned || crypto.randomBytes(6).toString('hex');
}

/**
 * Generate a strong random password for the Postgres role
 */
export function generateDbPassword(): string {
  return crypto.randomBytes(18).toString('base64url').replace(/[-_]/g, '').slice(0, 28);
}

async function adminClient(database = 'postgres'): Promise<Client> {
  const client = new Client({
    user: PG_USER,
    password: PG_PASS,
    host: PG_HOST,
    port: PG_PORT,
    database,
    connectionTimeoutMillis: 5000,
  });
  await client.connect();
  return client;
}

export type ProvisionedDb = {
  database: string;
  role: string;
  password: string;
  host: string;
  port: number;
  connectionUri: string;
  pooledConnectionUri: string;
};

/**
 * Provision a real Postgres database + role for a project/branch.
 * - Creates role `neondb_<sanitized>` with LOGIN + PASSWORD
 * - Creates database `proj_<sanitized>` OWNER the role
 * - Grants all privileges
 * - Returns connection strings (direct + pooled)
 */
export async function provisionDatabase(rawId: string): Promise<ProvisionedDb> {
  if (!PG_PASS) {
    throw new Error('Servidor de banco não configurado. Contate o administrador.');
  }

  const short = sanitizeId(rawId);
  // Add a random suffix to avoid collisions even with same name
  const suffix = crypto.randomBytes(3).toString('hex');
  const dbName = `proj_${short}_${suffix}`;
  const roleName = `neondb_${short}_${suffix}`;
  const password = generateDbPassword();

  const client = await adminClient('postgres');
  try {
    // Quote identifiers safely (they only contain [a-z0-9_] so no injection possible)
    await client.query(`CREATE ROLE "${roleName}" WITH LOGIN PASSWORD '${password.replace(/'/g, "''")}';`);
    await client.query(`CREATE DATABASE "${dbName}" OWNER "${roleName}";`);
    await client.query(`GRANT ALL PRIVILEGES ON DATABASE "${dbName}" TO "${roleName}";`);
  } finally {
    await client.end();
  }

  // Connect to the new database to grant schema privileges + create extensions
  const dbClient = await adminClient(dbName);
  try {
    await dbClient.query(`GRANT ALL ON SCHEMA public TO "${roleName}";`);
    await dbClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${roleName}";`);
    await dbClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${roleName}";`);
    // Enable common extensions
    try { await dbClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'); } catch {}
    try { await dbClient.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";'); } catch {}
  } finally {
    await dbClient.end();
  }

  const base = `postgresql://${roleName}:${encodeURIComponent(password)}@${PUBLIC_HOST}:${PG_PORT}/${dbName}?sslmode=disable`;
  // Pooled version (same in our setup — in real Neon this goes through PgBouncer)
  const pooled = base; // would be different port/host with PgBouncer

  return {
    database: dbName,
    role: roleName,
    password,
    host: PUBLIC_HOST,
    port: PG_PORT,
    connectionUri: base,
    pooledConnectionUri: pooled,
  };
}

/**
 * Clone a database (used for branching) using pg_dump + pg_restore
 * via SQL. We use the simpler approach of CREATE DATABASE WITH TEMPLATE.
 */
export async function cloneDatabase(
  sourceDbName: string,
  newRawId: string
): Promise<ProvisionedDb> {
  if (!PG_PASS) {
    throw new Error('Servidor de banco não configurado.');
  }

  const short = sanitizeId(newRawId);
  const suffix = crypto.randomBytes(3).toString('hex');
  const newDbName = `proj_${short}_${suffix}`;
  const newRoleName = `neondb_${short}_${suffix}`;
  const password = generateDbPassword();

  const client = await adminClient('postgres');
  try {
    await client.query(`CREATE ROLE "${newRoleName}" WITH LOGIN PASSWORD '${password.replace(/'/g, "''")}';`);
    // CREATE DATABASE WITH TEMPLATE copies schema + data, but requires no active connections
    // We terminate existing connections to the source first
    await client.query(`
      SELECT pg_terminate_backend(pid) FROM pg_stat_activity
      WHERE datname = '${sourceDbName.replace(/'/g, "''")}' AND pid <> pg_backend_pid();
    `);
    await client.query(`CREATE DATABASE "${newDbName}" WITH TEMPLATE "${sourceDbName}" OWNER "${newRoleName}";`);
    await client.query(`GRANT ALL PRIVILEGES ON DATABASE "${newDbName}" TO "${newRoleName}";`);
  } finally {
    await client.end();
  }

  const dbClient = await adminClient(newDbName);
  try {
    await dbClient.query(`GRANT ALL ON SCHEMA public TO "${newRoleName}";`);
    await dbClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${newRoleName}";`);
    await dbClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${newRoleName}";`);
  } finally {
    await dbClient.end();
  }

  const base = `postgresql://${newRoleName}:${encodeURIComponent(password)}@${PUBLIC_HOST}:${PG_PORT}/${newDbName}?sslmode=disable`;

  return {
    database: newDbName,
    role: newRoleName,
    password,
    host: PUBLIC_HOST,
    port: PG_PORT,
    connectionUri: base,
    pooledConnectionUri: base,
  };
}

/**
 * Drop a database and its role (used when deleting a project)
 */
export async function dropDatabase(database: string, role: string): Promise<void> {
  if (!PG_PASS) return;
  const client = await adminClient('postgres');
  try {
    // Terminate existing connections
    await client.query(`
      SELECT pg_terminate_backend(pid) FROM pg_stat_activity
      WHERE datname = '${database.replace(/'/g, "''")}' AND pid <> pg_backend_pid();
    `);
    await client.query(`DROP DATABASE IF EXISTS "${database}";`);
    await client.query(`DROP ROLE IF EXISTS "${role}";`);
  } finally {
    await client.end();
  }
}

/**
 * Execute a SQL query against a user's database as the user's role.
 * Returns rows for SELECT, or row count for INSERT/UPDATE/DELETE.
 */
export async function executeUserQuery(
  database: string,
  role: string,
  password: string,
  query: string
): Promise<{
  columns?: string[];
  rows?: any[][];
  rowCount?: number;
  message?: string;
  executionTime: number;
}> {
  const start = Date.now();
  const client = new Client({
    user: role,
    password,
    host: PG_HOST,
    port: PG_PORT,
    database,
    connectionTimeoutMillis: 5000,
    query_timeout: 30000, // 30s max per query
  });

  try {
    await client.connect();
    const result = await client.query(query);
    const executionTime = Date.now() - start;

    if (result.rows && result.rows.length > 0) {
      const columns = Object.keys(result.rows[0]);
      const rows = result.rows.map((r: any) => columns.map(c => r[c]));
      return {
        columns,
        rows,
        rowCount: result.rowCount ?? rows.length,
        executionTime,
      };
    }

    // DDL / DML without rows
    let message = 'OK';
    const trimmed = query.trim().toLowerCase();
    if (trimmed.startsWith('insert')) message = `INSERT 0 ${result.rowCount ?? 1}`;
    else if (trimmed.startsWith('update')) message = `UPDATE ${result.rowCount ?? 0}`;
    else if (trimmed.startsWith('delete')) message = `DELETE ${result.rowCount ?? 0}`;
    else if (trimmed.startsWith('create')) message = 'CREATE';
    else if (trimmed.startsWith('drop')) message = 'DROP';
    else if (trimmed.startsWith('alter')) message = 'ALTER';

    return {
      message,
      rowCount: result.rowCount ?? 0,
      executionTime,
    };
  } finally {
    try { await client.end(); } catch {}
  }
}
