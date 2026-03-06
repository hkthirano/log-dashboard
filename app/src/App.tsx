import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { FilePicker } from './components/FilePicker'
import { StatsCards } from './components/StatsCards'
import { TopPaths } from './components/TopPaths'
import { StatusChart } from './components/StatusChart'
import { useDuckDB } from './hooks/useDuckDB'
import { useDirectoryWatch } from './hooks/useDirectoryWatch'
import { isOpfsAvailable } from './lib/duckdb'

interface AnalysisEntry {
  analyzed: string[]
  skipped: string[]
  analyzedAt: Date
}

const STORAGE_KEY = 'log-dashboard:analysis-log'
const HASHES_KEY = 'log-dashboard:seen-hashes'

function loadLog(): AnalysisEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return (JSON.parse(raw) as { analyzed: string[]; skipped: string[]; analyzedAt: string }[]).map((e) => ({
      analyzed: e.analyzed ?? [],
      skipped: e.skipped ?? [],
      analyzedAt: new Date(e.analyzedAt),
    }))
  } catch {
    return []
  }
}

function loadSeenHashes(): Set<string> {
  try {
    const raw = localStorage.getItem(HASHES_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

const STATUS_LABEL: Record<string, string> = {
  initializing: 'データを確認中...',
  parsing: 'ログを解析中...',
  loading: 'DuckDB にロード中...',
  querying: '集計クエリ実行中...',
}

function fmtDate(d: Date) {
  return d.toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'medium' })
}

export default function App() {
  const { status, stats, error, rowCount, analyze, clear } = useDuckDB()
  const [analysisLog, setAnalysisLog] = useState<AnalysisEntry[]>(loadLog)
  const [watchDirHandle, setWatchDirHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const seenHashesRef = useRef<Set<string>>(loadSeenHashes())
  const opfsAvailable = isOpfsAvailable()

  function addEntry(analyzed: string[], skipped: string[]) {
    setAnalysisLog((prev) => [...prev, { analyzed, skipped, analyzedAt: new Date() }])
  }

  function handleLoad(texts: string[], paths: string[], skipped: string[]) {
    addEntry(paths, skipped)
    if (texts.length > 0) analyze(texts)
  }

  const handleNewFiles = useCallback((texts: string[], paths: string[], skipped: string[]) => {
    addEntry(paths, skipped)
    if (texts.length > 0) analyze(texts)
  }, [analyze])

  async function handleSetWatch() {
    const dirHandle = await window.showDirectoryPicker()
    setWatchDirHandle(dirHandle)
  }

  function handleClear() {
    setWatchDirHandle(null)
    setAnalysisLog([])
    seenHashesRef.current.clear()
    localStorage.removeItem(HASHES_KEY)
    clear()
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analysisLog))
  }, [analysisLog])

  useEffect(() => {
    localStorage.setItem(HASHES_KEY, JSON.stringify([...seenHashesRef.current]))
  }, [analysisLog])

  useDirectoryWatch(watchDirHandle, seenHashesRef, handleNewFiles)

  const isLoading = ['initializing', 'parsing', 'loading', 'querying'].includes(status)
  const isDone = status === 'done'
  const isIdle = status === 'idle' || status === 'error'

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Log Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Apache アクセスログ解析ツール（ブラウザ完結）</p>
        {!opfsAvailable && (
          <p className="text-yellow-500 text-xs mt-2">
            ⚠ Cross-Origin Isolated ではないため、データはリロード後に消えます。
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
            <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground flex-wrap">
              <span>{rowCount.toLocaleString()} 件</span>
              {watchDirHandle && (
                <Badge variant="outline" className="text-green-400 border-green-800 bg-green-950 gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  監視中（10秒ごと）
                </Badge>
              )}
              <div className="ml-auto flex items-center gap-2">
                <FilePicker onLoad={handleLoad} onWatchDir={setWatchDirHandle} disabled={false} label="追加読み込み" seenHashesRef={seenHashesRef} />
                <Button variant="outline" size="sm" onClick={handleSetWatch}>
                  監視フォルダを設定
                </Button>
                <Button variant="secondary" size="sm" onClick={handleClear}>
                  データを消去
                </Button>
              </div>
            </div>

            {analysisLog.length > 0 && (
              <Card className="mb-4">
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-3">解析ログ</p>
                  <div className="flex flex-col gap-3 max-h-48 overflow-y-auto">
                    {analysisLog.map((entry, i) => (
                      <div key={i}>
                        <p className="text-xs text-muted-foreground tabular-nums mb-1">{fmtDate(entry.analyzedAt)}</p>
                        <ul className="flex flex-col gap-0.5">
                          {entry.analyzed.map((f) => (
                            <li key={f} className="text-xs font-mono text-foreground/80 pl-3">
                              {f}
                            </li>
                          ))}
                          {entry.skipped.map((f) => (
                            <li key={f} className="text-xs font-mono text-muted-foreground pl-3">
                              {f} <span className="text-yellow-600">（スキップ済み）</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {stats && (
              <>
                <StatsCards stats={stats} />
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
                  <TopPaths topPaths={stats.topPaths} />
                  <StatusChart statusCodes={stats.statusCodes} />
                </div>
              </>
            )}
          </div>
        ) : isIdle ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <FilePicker onLoad={handleLoad} onWatchDir={setWatchDirHandle} disabled={false} seenHashesRef={seenHashesRef} />
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        ) : null}
      </main>
    </div>
  )
}
