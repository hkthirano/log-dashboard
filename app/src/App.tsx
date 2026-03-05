import { useState } from 'react'
import { FilePicker } from './components/FilePicker'
import { StatsCards } from './components/StatsCards'
import { TopPaths } from './components/TopPaths'
import { StatusChart } from './components/StatusChart'
import { useDuckDB } from './hooks/useDuckDB'
import './App.css'

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
    <div className="app">
      <header className="app-header">
        <h1>Log Dashboard</h1>
        <p className="app-subtitle">Apache アクセスログ解析ツール（ブラウザ完結）</p>
      </header>

      <main className="app-main">
        {status === 'idle' || status === 'error' ? (
          <div className="landing">
            <FilePicker onLoad={handleLoad} disabled={false} />
            {error && <p className="error-msg">{error}</p>}
          </div>
        ) : status === 'done' ? (
          <div className="dashboard">
            <div className="dashboard-meta">
              <span>{fileNames.join(', ')}</span>
              <span>{rowCount.toLocaleString()} 件</span>
              <button className="reset-btn" onClick={() => { setFileNames([]); window.location.reload() }}>
                リセット
              </button>
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
        ) : (
          <div className="loading">
            <div className="spinner" />
            <p>{STATUS_LABEL[status]}</p>
          </div>
        )}
      </main>
    </div>
  )
}
