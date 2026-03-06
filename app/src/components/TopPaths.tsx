import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Stats } from '../types/log'

interface Props {
  topPaths: Stats['topPaths']
}

export function TopPaths({ topPaths }: Props) {
  const data = topPaths.map((row) => ({
    path: row.path.length > 36 ? row.path.slice(0, 33) + '...' : row.path,
    fullPath: row.path,
    count: row.count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>上位 URL</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#888', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
            />
            <YAxis
              type="category"
              dataKey="path"
              width={160}
              tick={{ fill: '#ccc', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, fontSize: 12 }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullPath ?? ''}
              labelStyle={{ color: '#ccc', fontFamily: 'monospace', wordBreak: 'break-all' }}
              formatter={(value: number | undefined) => [(value ?? 0).toLocaleString(), 'リクエスト数']}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="count" name="リクエスト数" fill="#60a5fa" radius={[0, 3, 3, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
