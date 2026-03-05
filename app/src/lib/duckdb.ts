import * as duckdb from '@duckdb/duckdb-wasm'
import mvpWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url'
import mvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url'
import ehWasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url'
import ehWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url'
import type { LogEntry } from '../types/log'

const BUNDLES: duckdb.DuckDBBundles = {
  mvp: { mainModule: mvpWasm, mainWorker: mvpWorker },
  eh: { mainModule: ehWasm, mainWorker: ehWorker },
}

const DB_PATH = 'opfs://log-dashboard.db'

let db: duckdb.AsyncDuckDB | null = null

export async function getDB(): Promise<duckdb.AsyncDuckDB> {
  if (db) return db

  const bundle = await duckdb.selectBundle(BUNDLES)
  const worker = new Worker(bundle.mainWorker!)
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING)
  db = new duckdb.AsyncDuckDB(logger, worker)
  await db.instantiate(bundle.mainModule)
  await db.open({
    path: DB_PATH,
    accessMode: duckdb.DuckDBAccessMode.READ_WRITE,
  })
  return db
}

export async function hasExistingData(): Promise<boolean> {
  const db = await getDB()
  const conn = await db.connect()
  try {
    const result = await conn.query(
      `SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_name = 'logs'`,
    )
    const count = Number(result.toArray()[0].cnt)
    if (count === 0) return false
    const rows = await conn.query(`SELECT COUNT(*) AS cnt FROM logs`)
    return Number(rows.toArray()[0].cnt) > 0
  } finally {
    await conn.close()
  }
}

export async function loadLogs(entries: LogEntry[]): Promise<void> {
  const db = await getDB()
  const conn = await db.connect()

  await conn.query(`
    CREATE TABLE IF NOT EXISTS logs (
      ip        VARCHAR,
      identity  VARCHAR,
      "user"    VARCHAR,
      ts        TIMESTAMP,
      method    VARCHAR,
      path      VARCHAR,
      protocol  VARCHAR,
      status    INTEGER,
      bytes     BIGINT,
      referer   VARCHAR,
      user_agent VARCHAR
    )
  `)

  const rows = entries.map((e) => ({
    ip: e.ip,
    identity: e.identity,
    user: e.user,
    ts: isNaN(e.timestamp.getTime()) ? null : e.timestamp.toISOString(),
    method: e.method,
    path: e.path,
    protocol: e.protocol,
    status: e.status,
    bytes: e.bytes,
    referer: e.referer,
    user_agent: e.userAgent,
  }))

  await db.registerFileText('logs.json', JSON.stringify(rows))
  await conn.query(`
    INSERT INTO logs
    SELECT
      ip, identity, "user",
      ts::TIMESTAMP,
      method, path, protocol,
      status, bytes, referer, user_agent
    FROM read_json_auto('logs.json')
  `)

  await conn.close()
}

export async function clearLogs(): Promise<void> {
  const db = await getDB()
  const conn = await db.connect()
  await conn.query(`DROP TABLE IF EXISTS logs`)
  await conn.close()
}

export async function queryStats() {
  const db = await getDB()
  const conn = await db.connect()

  const [summary, topPaths, statusCodes, perHour] = await Promise.all([
    conn.query(`
      SELECT
        COUNT(*)                                   AS total_requests,
        COUNT(DISTINCT ip)                         AS unique_ips,
        ROUND(SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS error_rate,
        SUM(bytes)                                 AS total_bytes
      FROM logs
    `),
    conn.query(`
      SELECT path, COUNT(*) AS cnt
      FROM logs
      GROUP BY path
      ORDER BY cnt DESC
      LIMIT 10
    `),
    conn.query(`
      SELECT status, COUNT(*) AS cnt
      FROM logs
      GROUP BY status
      ORDER BY status
    `),
    conn.query(`
      SELECT strftime(ts, '%Y-%m-%d %H:00') AS hour, COUNT(*) AS cnt
      FROM logs
      WHERE ts IS NOT NULL
      GROUP BY hour
      ORDER BY hour
    `),
  ])

  await conn.close()

  const s = summary.toArray()[0]
  return {
    totalRequests: Number(s.total_requests),
    uniqueIps: Number(s.unique_ips),
    errorRate: Number(s.error_rate),
    totalBytes: Number(s.total_bytes),
    topPaths: topPaths.toArray().map((r) => ({ path: r.path as string, count: Number(r.cnt) })),
    statusCodes: statusCodes.toArray().map((r) => ({ status: Number(r.status), count: Number(r.cnt) })),
    requestsPerHour: perHour.toArray().map((r) => ({ hour: r.hour as string, count: Number(r.cnt) })),
  }
}
