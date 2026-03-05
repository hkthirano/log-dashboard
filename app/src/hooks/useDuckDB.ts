import { useState, useCallback } from 'react'
import { parseText } from '../lib/logParser'
import { loadLogs, queryStats } from '../lib/duckdb'
import type { Stats } from '../types/log'

type Status = 'idle' | 'parsing' | 'loading' | 'querying' | 'done' | 'error'

export function useDuckDB() {
  const [status, setStatus] = useState<Status>('idle')
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rowCount, setRowCount] = useState(0)

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
      setStatus('done')
    } catch (e) {
      setError(String(e))
      setStatus('error')
    }
  }, [])

  return { status, stats, error, rowCount, analyze }
}
