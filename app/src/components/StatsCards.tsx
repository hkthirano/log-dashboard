import { Card, CardContent } from '@/components/ui/card'
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {[
        { label: 'Total Requests', value: fmt(stats.totalRequests) },
        { label: 'Unique IPs', value: fmt(stats.uniqueIps) },
        { label: 'Error Rate', value: `${stats.errorRate}%` },
        { label: 'Data Transferred', value: fmtBytes(stats.totalBytes) },
      ].map(({ label, value }) => (
        <Card key={label} className="py-0 gap-0">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
