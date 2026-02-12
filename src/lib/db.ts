import { Pool, QueryResult, QueryResultRow } from 'pg'; //  Adicionado QueryResultRow

// Singleton para conexão com PostgreSQL
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Erro inesperado no pool de conexões:', err);
    });

    console.log('✅ Pool de conexões PostgreSQL criado');
  }
  return pool;
}

/**
 * Executa uma query SQL
 * Adicionada a restrição <T extends QueryResultRow> para o TypeScript
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();

  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    console.log('Query executada:', {
      text: text.substring(0, 100),
                duration: `${duration}ms`,
                rows: res.rowCount,
    });

    return res;
  } catch (error) {
    console.error('❌ Erro ao executar query:', {
      query: text,
      params,
      error,
    });
    throw error;
  }
}

/**
 * Executa uma transação
 * Também adicionada a restrição QueryResultRow no callback se necessário
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔌 Pool de conexões PostgreSQL fechado');
  }
}
