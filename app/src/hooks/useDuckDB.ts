import { useState, useCallback, useEffect } from 'react'
import { parseText } from '../lib/logParser'
import { loadLogs, queryStats, restoreFromOpfs, hasExistingData, clearLogs } from '../lib/duckdb'
import type { Stats } from '../types/log'

type Status = 'initializing' | 'idle' | 'parsing' | 'loading' | 'querying' | 'done' | 'error'

export function useDuckDB() {
  const [status, setStatus] = useState<Status>('initializing')
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rowCount, setRowCount] = useState(0)

  // On startup: restore Parquet from OPFS and display the dashboard
  useEffect(() => {
    ;(async () => {
      try {
        const restored = await restoreFromOpfs()
        if (restored) {
          setStatus('querying')
          const result = await queryStats()
          setStats(result)
          setRowCount(result.totalRequests)
          setStatus('done')
          return
        }
        // Even without OPFS, display if data already exists in memory
        const exists = await hasExistingData()
        if (exists) {
          setStatus('querying')
          const result = await queryStats()
          setStats(result)
          setRowCount(result.totalRequests)
          setStatus('done')
        } else {
          setStatus('idle')
        }
      } catch {
        setStatus('idle')
      }
    })()
  }, [])

  const analyze = useCallback(async (texts: string[]) => {
    try {
      setError(null)
      setStatus('parsing')
      const entries = texts.flatMap((t) => parseText(t))
      setRowCount(entries.length)

      setStatus('loading')
      await loadLogs(entries)

      setStatus('querying')
      const result = await queryStats()
      setStats(result)
      setRowCount(result.totalRequests)
      setStatus('done')
    } catch (e) {
      setError(String(e))
      setStatus('error')
    }
  }, [])

  const clear = useCallback(async () => {
    try {
      await clearLogs()
      setStats(null)
      setRowCount(0)
      setStatus('idle')
    } catch (e) {
      setError(String(e))
    }
  }, [])

  return { status, stats, error, rowCount, analyze, clear }
}
