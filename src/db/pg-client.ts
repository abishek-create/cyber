/**
 * Cloud SQL PostgreSQL Native Connection Layer using 'pg' (node-postgres)
 * 
 * Complies with the Cloud SQL Object Method configuration:
 * - Uses process.env.SQL_HOST, SQL_USER, SQL_PASSWORD, SQL_DB_NAME
 * - Lazy connection pooling (no eager startup probes)
 * - Safe parameterized queries and transaction helpers
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

declare global {
  var _nativePostgresPool: Pool | undefined;
}

export function getPgPool(): Pool {
  if (!global._nativePostgresPool) {
    global._nativePostgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });

    global._nativePostgresPool.on('error', (err) => {
      console.error('[Cloud SQL] Unexpected error on idle client:', err);
    });
  }

  return global._nativePostgresPool;
}

/**
 * Execute a parameterized SQL query safely
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPgPool();
  try {
    return await pool.query<T>(text, params);
  } catch (error: any) {
    console.error('[Cloud SQL Query Error]:', error.message);
    throw new Error('Database query execution failed', { cause: error });
  }
}

/**
 * Execute multiple operations inside an ACID transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPgPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Cloud SQL Transaction Error - Rolled Back]:', error);
    throw error;
  } finally {
    client.release();
  }
}
