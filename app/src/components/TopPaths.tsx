import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Stats } from '../types/log'

interface Props {
  topPaths: Stats['topPaths']
}

export function TopPaths({ topPaths }: Props) {
  const max = topPaths[0]?.count ?? 1
  return (
    <Card>
      <CardHeader>
        <CardTitle>上位 URL</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>パス</TableHead>
              <TableHead className="text-right">リクエスト数</TableHead>
              <TableHead className="w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topPaths.map((row, i) => (
              <TableRow key={row.path}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-mono max-w-xs truncate">{row.path}</TableCell>
                <TableCell className="text-right">{row.count.toLocaleString()}</TableCell>
                <TableCell>
                  <div
                    className="h-1.5 bg-primary rounded-full"
                    style={{ width: `${(row.count / max) * 100}%` }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
