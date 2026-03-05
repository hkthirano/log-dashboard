import type { Stats } from '../types/log'

function fmt(n: number) {
  return n.toLocaleString()
}

function fmtBytes(bytes: number) {
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB'
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB'
  if (bytes >= 1e3) return (bytes / 1e3).toFixed(1) + ' KB'
  return bytes + ' B'
}

interface Props {
  stats: Stats
}

export function StatsCards({ stats }: Props) {
  return (
    <div className="stats-cards">
      <div className="stat-card">
        <div className="stat-label">総リクエスト</div>
        <div className="stat-value">{fmt(stats.totalRequests)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">ユニーク IP</div>
        <div className="stat-value">{fmt(stats.uniqueIps)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">エラー率</div>
        <div className="stat-value">{stats.errorRate}%</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">転送量</div>
        <div className="stat-value">{fmtBytes(stats.totalBytes)}</div>
      </div>
    </div>
  )
}
