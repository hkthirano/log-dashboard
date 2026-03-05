import { useState } from 'react'
import { FilePicker } from './components/FilePicker'
import { StatsCards } from './components/StatsCards'
import { TopPaths } from './components/TopPaths'
import { StatusChart } from './components/StatusChart'
import { useDuckDB } from './hooks/useDuckDB'
import { isOpfsAvailable } from './lib/duckdb'
import './App.css'

const STATUS_LABEL: Record<string, string> = {
  initializing: 'データを確認中...',
  parsing: 'ログを解析中...',
  loading: 'DuckDB にロード中...',
  querying: '集計クエリ実行中...',
}

export default function App() {
  const { status, stats, error, rowCount, analyze, clear } = useDuckDB()
  const [fileNames, setFileNames] = useState<string[]>([])
  const opfsAvailable = isOpfsAvailable()

  function handleLoad(texts: string[], names: string[]) {
    setFileNames(names)
    analyze(texts)
  }

  const isLoading = status === 'initializing' || status === 'parsing' || status === 'loading' || status === 'querying'
  const isDone = status === 'done'
  const isIdle = status === 'idle' || status === 'error'

  return (
    <div className="app">
      <header className="app-header">
        <h1>Log Dashboard</h1>
        <p className="app-subtitle">Apache アクセスログ解析ツール（ブラウザ完結）</p>
        {!opfsAvailable && (
          <p className="opfs-warning">⚠ このページは Cross-Origin Isolated ではないため、データはリロード後に消えます。</p>
        )}
      </header>

      <main className="app-main">
        {isLoading ? (
          <div className="loading">
            <div className="spinner" />
            <p>{STATUS_LABEL[status]}</p>
          </div>
        ) : isDone ? (
          <div className="dashboard">
            <div className="dashboard-meta">
              {fileNames.length > 0 && <span>{fileNames.join(', ')}</span>}
              <span>{rowCount.toLocaleString()} 件</span>
              <div className="dashboard-actions">
                <FilePicker onLoad={handleLoad} disabled={false} label="追加読み込み" />
                <button className="reset-btn" onClick={clear}>データを消去</button>
              </div>
            </div>
            {stats && (
              <>
                <StatsCards stats={stats} />
                <div className="panels">
                  <TopPaths topPaths={stats.topPaths} />
                  <StatusChart statusCodes={stats.statusCodes} />
                </div>
              </>
            )}
          </div>
        ) : isIdle ? (
          <div className="landing">
            <FilePicker onLoad={handleLoad} disabled={false} />
            {error && <p className="error-msg">{error}</p>}
          </div>
        ) : null}
      </main>
    </div>
  )
}
