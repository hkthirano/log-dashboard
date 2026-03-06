import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FilePicker } from './components/FilePicker'
import { StatsCards } from './components/StatsCards'
import { TopPaths } from './components/TopPaths'
import { StatusChart } from './components/StatusChart'
import { useDuckDB } from './hooks/useDuckDB'

const STATUS_LABEL: Record<string, string> = {
  idle: '',
  parsing: 'ログを解析中...',
  loading: 'DuckDB にロード中...',
  querying: '集計クエリ実行中...',
  done: '',
  error: 'エラーが発生しました',
}

export default function App() {
  const { status, stats, error, rowCount, analyze } = useDuckDB()
  const [fileNames, setFileNames] = useState<string[]>([])

  function handleLoad(texts: string[], names: string[]) {
    setFileNames(names)
    analyze(texts)
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Log Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Apache アクセスログ解析ツール（ブラウザ完結）</p>
      </header>

      <main>
        {status === 'idle' || status === 'error' ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <FilePicker onLoad={handleLoad} disabled={false} />
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        ) : status === 'done' ? (
          <div>
            <div className="flex items-center gap-3 mb-5 text-sm text-muted-foreground flex-wrap">
              {fileNames.length > 0 && <span>{fileNames.join(', ')}</span>}
              <span>{rowCount.toLocaleString()} 件</span>
              <div className="ml-auto flex items-center gap-2">
                <FilePicker onLoad={handleLoad} disabled={false} label="追加読み込み" />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setFileNames([]); window.location.reload() }}
                >
                  リセット
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
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
            <div className="w-10 h-10 border-[3px] border-muted border-t-primary rounded-full animate-spin" />
            <p>{STATUS_LABEL[status]}</p>
          </div>
        )}
      </main>
    </div>
  )
}
