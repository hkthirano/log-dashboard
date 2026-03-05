import type { Stats } from '../types/log'

interface Props {
  statusCodes: Stats['statusCodes']
}

function statusColor(s: number) {
  if (s < 300) return '#4ade80'
  if (s < 400) return '#facc15'
  if (s < 500) return '#f97316'
  return '#f87171'
}

export function StatusChart({ statusCodes }: Props) {
  const total = statusCodes.reduce((a, b) => a + b.count, 0)
  return (
    <div className="panel">
      <h2>ステータスコード</h2>
      <div className="status-bar">
        {statusCodes.map((s) => (
          <div
            key={s.status}
            className="status-segment"
            style={{ width: `${(s.count / total) * 100}%`, background: statusColor(s.status) }}
            title={`${s.status}: ${s.count.toLocaleString()}`}
          />
        ))}
      </div>
      <div className="status-legend">
        {statusCodes.map((s) => (
          <div key={s.status} className="legend-item">
            <span className="legend-dot" style={{ background: statusColor(s.status) }} />
            <span>{s.status}</span>
            <span className="legend-count">{s.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
