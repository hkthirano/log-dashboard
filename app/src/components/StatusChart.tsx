import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
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
  const data = statusCodes.map((s) => ({ name: String(s.status), value: s.count }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>ステータスコード</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
            >
              {statusCodes.map((s) => (
                <Cell key={s.status} fill={statusColor(s.status)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: '#ccc' }}
              itemStyle={{ color: '#ccc' }}
              formatter={(value: number | undefined) => [(value ?? 0).toLocaleString(), 'リクエスト数']}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ color: '#aaa', fontSize: 12 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
