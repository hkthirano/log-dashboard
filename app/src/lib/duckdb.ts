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

const OPFS_FILENAME = 'logs.parquet'
const DUCKDB_PARQUET_PATH = 'opfs_logs.parquet'

let db: duckdb.AsyncDuckDB | null = null

export function isOpfsAvailable(): boolean {
  return typeof navigator.storage?.getDirectory === 'function'
}

export async function getDB(): Promise<duckdb.AsyncDuckDB> {
  if (db) return db

  const bundle = await duckdb.selectBundle(BUNDLES)
  const worker = new Worker(bundle.mainWorker!)
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING)
  db = new duckdb.AsyncDuckDB(logger, worker)
  await db.instantiate(bundle.mainModule)
  return db
}

// OPFS からログを読み込んで DuckDB に復元する
export async function restoreFromOpfs(): Promise<boolean> {
  if (!isOpfsAvailable()) return false
  try {
    const root = await navigator.storage.getDirectory()
    const fh = await root.getFileHandle(OPFS_FILENAME)
    const file = await fh.getFile()
    const buffer = new Uint8Array(await file.arrayBuffer())
    if (buffer.byteLength === 0) return false

    const db = await getDB()
    await db.registerFileBuffer(DUCKDB_PARQUET_PATH, buffer)
    const conn = await db.connect()
    await conn.query(`CREATE OR REPLACE TABLE logs AS SELECT * FROM read_parquet('${DUCKDB_PARQUET_PATH}')`)

    // Migrate old TIMESTAMP column to BIGINT (epoch ms) if needed
    const colInfo = await conn.query(
      `SELECT data_type FROM information_schema.columns WHERE table_name = 'logs' AND column_name = 'ts'`
    )
    const colType = colInfo.toArray()[0]?.data_type as string | undefined
    if (colType && colType.toUpperCase().startsWith('TIMESTAMP')) {
      await conn.query(`
        CREATE OR REPLACE TABLE logs AS
          SELECT ip, identity, "user",
                 epoch_ms(ts)::BIGINT AS ts,
                 method, path, protocol, status, bytes, referer, user_agent
          FROM logs
      `)
      await conn.close()
      await saveToOpfs()
    } else {
      await conn.close()
    }

    return true
  } catch {
    return false
  }
}

// DuckDB の logs テーブルを Parquet にエクスポートして OPFS に保存する
async function saveToOpfs(): Promise<void> {
  if (!isOpfsAvailable()) return
  const db = await getDB()
  const conn = await db.connect()
  await conn.query(`COPY logs TO '${DUCKDB_PARQUET_PATH}' (FORMAT PARQUET)`)
  await conn.close()

  const shared = await db.copyFileToBuffer(DUCKDB_PARQUET_PATH)
  // SharedArrayBuffer → ArrayBuffer にコピー（FileSystemWritableFileStream は SAB を受け付けない）
  const buffer = shared.slice().buffer as ArrayBuffer
  const root = await navigator.storage.getDirectory()
  const fh = await root.getFileHandle(OPFS_FILENAME, { create: true })
  const writable = await fh.createWritable()
  await writable.write(buffer)
  await writable.close()
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
      ts        BIGINT,
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
    ts: isNaN(e.timestamp.getTime()) ? null : e.timestamp.getTime(),
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
    SELECT ip, identity, "user", CAST(ts AS BIGINT), method, path, protocol,
           status, bytes, referer, user_agent
    FROM read_json_auto('logs.json')
  `)
  await conn.close()

  await saveToOpfs()
}

export async function clearLogs(): Promise<void> {
  const db = await getDB()
  const conn = await db.connect()
  await conn.query(`DROP TABLE IF EXISTS logs`)
  await conn.close()

  if (isOpfsAvailable()) {
    try {
      const root = await navigator.storage.getDirectory()
      await root.removeEntry(OPFS_FILENAME)
    } catch {
      // ファイルが存在しない場合は無視
    }
  }
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
      SELECT strftime(epoch_ms(ts), '%Y-%m-%d %H:00') AS hour, COUNT(*) AS cnt
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
