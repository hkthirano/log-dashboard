import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { FilePicker, FilePickerDropZone } from './components/FilePicker'
import { StatsCards } from './components/StatsCards'
import { RequestsChart } from './components/RequestsChart'
import { TopPaths } from './components/TopPaths'
import { StatusChart } from './components/StatusChart'
import { useDuckDB } from './hooks/useDuckDB'
import { useDirectoryWatch } from './hooks/useDirectoryWatch'
import { isOpfsAvailable } from './lib/duckdb'
import { exportPdf } from './lib/export'
import { saveWatchHandles, loadWatchHandles, clearWatchHandles } from './lib/watchHandleStore'

export interface SkippedEntry {
  path: string
  duplicateOf: string
}

interface AnalysisEntry {
  analyzed: string[]
  skipped: SkippedEntry[]
  analyzedAt: Date
}

const STORAGE_KEY = 'log-dashboard:analysis-log'
const HASHES_KEY = 'log-dashboard:seen-hashes'

function loadLog(): AnalysisEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return (
      JSON.parse(raw) as {
        analyzed: string[]
        skipped: (SkippedEntry | string)[]
        analyzedAt: string
      }[]
    ).map((e) => ({
      analyzed: e.analyzed ?? [],
      skipped: (e.skipped ?? []).map((s) =>
        typeof s === 'string' ? { path: s, duplicateOf: 'unknown' } : s,
      ),
      analyzedAt: new Date(e.analyzedAt),
    }))
  } catch {
    return []
  }
}

// Map<hash, filePath> — tracks content hashes to deduplicate files
function loadSeenHashes(): Map<string, string> {
  try {
    const raw = localStorage.getItem(HASHES_KEY)
    if (!raw) return new Map()
    return new Map(JSON.parse(raw) as [string, string][])
  } catch {
    return new Map()
  }
}

const STATUS_LABEL: Record<string, string> = {
  initializing: 'Initializing...',
  parsing: 'Parsing logs...',
  loading: 'Loading into DuckDB...',
  querying: 'Running queries...',
}

function fmtDate(d: Date) {
  return d.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' })
}

export default function App() {
  const { status, stats, error, rowCount, analyze, clear } = useDuckDB()
  const [analysisLog, setAnalysisLog] = useState<AnalysisEntry[]>(loadLog)
  // Active monitored folder handles
  const [watchDirHandles, setWatchDirHandles] = useState<FileSystemDirectoryHandle[]>([])
  // Handles restored from IndexedDB that need permission re-grant
  const [pendingHandles, setPendingHandles] = useState<FileSystemDirectoryHandle[]>([])
  const seenHashesRef = useRef<Map<string, string>>(loadSeenHashes())
  const opfsAvailable = isOpfsAvailable()

  // On mount: restore handles from IndexedDB and check permissions
  useEffect(() => {
    loadWatchHandles().then(async (handles) => {
      const active: FileSystemDirectoryHandle[] = []
      const pending: FileSystemDirectoryHandle[] = []
      for (const h of handles) {
        try {
          const perm = await h.queryPermission({ mode: 'read' })
          if (perm === 'granted') {
            active.push(h)
          } else {
            pending.push(h)
          }
        } catch {
          // Ignore stale/invalid handles (e.g. deleted folders)
        }
      }
      if (active.length > 0) setWatchDirHandles(active)
      if (pending.length > 0) setPendingHandles(pending)
    })
  }, [])

  // Persist handles to IndexedDB whenever they change
  useEffect(() => {
    saveWatchHandles([...watchDirHandles, ...pendingHandles])
  }, [watchDirHandles, pendingHandles])

  function addEntry(analyzed: string[], skipped: SkippedEntry[]) {
    setAnalysisLog((prev) => [...prev, { analyzed, skipped, analyzedAt: new Date() }])
  }

  function handleLoad(texts: string[], paths: string[], skipped: SkippedEntry[]) {
    addEntry(paths, skipped)
    if (texts.length > 0) analyze(texts)
  }

  const handleNewFiles = useCallback((texts: string[], paths: string[], skipped: SkippedEntry[]) => {
    addEntry(paths, skipped)
    if (texts.length > 0) analyze(texts)
  }, [analyze])

  function addWatchHandle(handle: FileSystemDirectoryHandle) {
    setWatchDirHandles((prev) =>
      prev.some((h) => h.name === handle.name) ? prev : [...prev, handle],
    )
    setPendingHandles((prev) => prev.filter((h) => h.name !== handle.name))
  }

  async function handleReconnect(handle: FileSystemDirectoryHandle) {
    try {
      const perm = await handle.requestPermission({ mode: 'read' })
      if (perm === 'granted') addWatchHandle(handle)
    } catch {
      // User cancelled — do nothing
    }
  }

  function handleRemoveWatch(name: string) {
    setWatchDirHandles((prev) => prev.filter((h) => h.name !== name))
    setPendingHandles((prev) => prev.filter((h) => h.name !== name))
  }

  function handleClear() {
    setWatchDirHandles([])
    setPendingHandles([])
    setAnalysisLog([])
    seenHashesRef.current.clear()
    localStorage.removeItem(HASHES_KEY)
    clearWatchHandles()
    clear()
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analysisLog))
  }, [analysisLog])

  useEffect(() => {
    localStorage.setItem(HASHES_KEY, JSON.stringify([...seenHashesRef.current]))
  }, [analysisLog])

  useDirectoryWatch(watchDirHandles, seenHashesRef, handleNewFiles)

  const isLoading = ['initializing', 'parsing', 'loading', 'querying'].includes(status)
  const isDone = status === 'done'
  const isIdle = status === 'idle' || status === 'error'

  const watchBadges = (
    <>
      {watchDirHandles.map((h) => (
        <Badge key={h.name} variant="outline" className="text-green-400 border-green-800 bg-green-950 gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {h.name}
          <button onClick={() => handleRemoveWatch(h.name)} className="ml-0.5 opacity-60 hover:opacity-100 leading-none" aria-label={`Stop monitoring ${h.name}`}>×</button>
        </Badge>
      ))}
      {pendingHandles.map((h) => (
        <Badge key={h.name} variant="outline" className="text-yellow-400 border-yellow-800 bg-yellow-950 gap-1.5 cursor-pointer hover:bg-yellow-900" onClick={() => handleReconnect(h)}>
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          Reconnect: {h.name}
          <button onClick={(e) => { e.stopPropagation(); handleRemoveWatch(h.name) }} className="ml-0.5 opacity-60 hover:opacity-100 leading-none" aria-label={`Remove ${h.name}`}>×</button>
        </Badge>
      ))}
    </>
  )

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Log Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Apache access log analyzer — runs entirely in your browser</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          <p className="text-xs text-muted-foreground">Your files are never uploaded — all analysis happens locally.</p>
          <p className="text-xs text-muted-foreground">Analyzed data is stored in your browser, so reloading the page is safe.</p>
        </div>
        {!opfsAvailable && (
          <p className="text-yellow-500 text-xs mt-2">
            ⚠ Not Cross-Origin Isolated — data will be lost on page reload.
          </p>
        )}
      </header>

      <main>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
            <div className="w-10 h-10 border-[3px] border-muted border-t-primary rounded-full animate-spin" />
            <p>{STATUS_LABEL[status]}</p>
          </div>
        ) : isDone ? (
          <div>
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground flex-wrap">
              <span className="mr-1">{rowCount.toLocaleString()} requests</span>
              {watchBadges}
              <div className="ml-auto flex items-center gap-2">
                <FilePicker onLoad={handleLoad} onWatchDir={addWatchHandle} seenHashesRef={seenHashesRef} />
                <Button variant="secondary" size="sm" onClick={handleClear}>Clear data</Button>
                <Button variant="outline" size="sm" onClick={() => exportPdf(stats!)}>Download PDF</Button>
              </div>
            </div>

            {analysisLog.length > 0 && (
              <Card className="mb-4">
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Analysis log</p>
                  <div className="flex flex-col gap-3 max-h-48 overflow-y-auto">
                    {(() => {
                      // Assign sequential IDs to analyzed files across all entries
                      const fileIds = new Map<string, number>()
                      let counter = 0
                      for (const entry of analysisLog) {
                        for (const f of entry.analyzed) fileIds.set(f, ++counter)
                      }
                      return analysisLog.map((entry, i) => (
                        <div key={i}>
                          <p className="text-xs text-muted-foreground tabular-nums mb-1">{fmtDate(entry.analyzedAt)}</p>
                          <ul className="flex flex-col gap-0.5">
                            {entry.analyzed.map((f) => (
                              <li key={f} className="text-xs font-mono text-foreground/80 pl-3">
                                <span className="text-muted-foreground mr-1.5">#{fileIds.get(f)}</span>{f}
                              </li>
                            ))}
                            {entry.skipped.map((s) => {
                              const dupId = fileIds.get(s.duplicateOf)
                              return (
                                <li key={s.path} className="text-xs font-mono text-muted-foreground pl-3">
                                  {s.path}
                                  <span className="text-yellow-600 ml-1">(skipped: same content as #{dupId})</span>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ))
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {stats && (
              <>
                <StatsCards stats={stats} />
                <RequestsChart requestsPerHour={stats.requestsPerHour} />
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
                  <TopPaths topPaths={stats.topPaths} />
                  <StatusChart statusCodes={stats.statusCodes} />
                </div>
              </>
            )}
          </div>
        ) : isIdle ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            {pendingHandles.length > 0 && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground">Re-grant access to previously monitored folders</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {pendingHandles.map((h) => (
                    <Badge
                      key={h.name}
                      variant="outline"
                      className="text-yellow-400 border-yellow-800 bg-yellow-950 gap-1.5 cursor-pointer hover:bg-yellow-900 px-3 py-1.5 text-sm"
                      onClick={() => handleReconnect(h)}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      Reconnect: {h.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <FilePickerDropZone onLoad={handleLoad} onWatchDir={addWatchHandle} seenHashesRef={seenHashesRef} />
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        ) : null}
      </main>
    </div>
  )
}
