import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FilePicker } from './components/FilePicker'
import { StatsCards } from './components/StatsCards'
import { TopPaths } from './components/TopPaths'
import { StatusChart } from './components/StatusChart'
import { useDuckDB } from './hooks/useDuckDB'
import { useDirectoryWatch } from './hooks/useDirectoryWatch'
import { isOpfsAvailable } from './lib/duckdb'

const STATUS_LABEL: Record<string, string> = {
  initializing: 'データを確認中...',
  parsing: 'ログを解析中...',
  loading: 'DuckDB にロード中...',
  querying: '集計クエリ実行中...',
}

export default function App() {
  const { status, stats, error, rowCount, analyze, clear } = useDuckDB()
  const [fileNames, setFileNames] = useState<string[]>([])
  const [watchDirHandle, setWatchDirHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const opfsAvailable = isOpfsAvailable()

  function handleLoad(texts: string[], names: string[]) {
    setFileNames(names)
    analyze(texts)
  }

  const handleNewFiles = useCallback((texts: string[], names: string[]) => {
    setFileNames((prev) => [...new Set([...prev, ...names])])
    analyze(texts)
  }, [analyze])

  function handleClear() {
    setWatchDirHandle(null)
    clear()
  }

  useDirectoryWatch(watchDirHandle, handleNewFiles)

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
            <div className="flex items-center gap-3 mb-5 text-sm text-muted-foreground flex-wrap">
              {fileNames.length > 0 && <span>{fileNames.join(', ')}</span>}
              <span>{rowCount.toLocaleString()} 件</span>
              {watchDirHandle && (
                <Badge variant="outline" className="text-green-400 border-green-800 bg-green-950 gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  監視中（10秒ごと）
                </Badge>
              )}
              <div className="ml-auto flex items-center gap-2">
                <FilePicker onLoad={handleLoad} onWatchDir={setWatchDirHandle} disabled={false} label="追加読み込み" />
                <Button variant="secondary" size="sm" onClick={handleClear}>
                  データを消去
                </Button>
              </div>
            </div>
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
            <FilePicker onLoad={handleLoad} onWatchDir={setWatchDirHandle} disabled={false} />
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        ) : null}
      </main>
    </div>
  )
}
