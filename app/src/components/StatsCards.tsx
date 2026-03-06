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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[
        { label: 'Total Requests', value: fmt(stats.totalRequests) },
        { label: 'Unique IPs', value: fmt(stats.uniqueIps) },
        { label: 'Error Rate', value: `${stats.errorRate}%` },
        { label: 'Data Transferred', value: fmtBytes(stats.totalBytes) },
      ].map(({ label, value }) => (
        <Card key={label}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
