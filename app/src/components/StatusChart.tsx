import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card>
      <CardHeader>
        <CardTitle>ステータスコード</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-4 rounded-full overflow-hidden mb-4">
          {statusCodes.map((s) => (
            <div
              key={s.status}
              className="h-full min-w-[2px] transition-opacity hover:opacity-80"
              style={{ width: `${(s.count / total) * 100}%`, background: statusColor(s.status) }}
              title={`${s.status}: ${s.count.toLocaleString()}`}
            />
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          {statusCodes.map((s) => (
            <div key={s.status} className="flex items-center gap-2 text-sm">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: statusColor(s.status) }}
              />
              <span>{s.status}</span>
              <span className="ml-auto text-muted-foreground">{s.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
