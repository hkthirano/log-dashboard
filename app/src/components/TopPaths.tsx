import type { Stats } from '../types/log'

interface Props {
  topPaths: Stats['topPaths']
}

export function TopPaths({ topPaths }: Props) {
  const max = topPaths[0]?.count ?? 1
  return (
    <div className="panel">
      <h2>上位 URL</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>パス</th>
            <th>リクエスト数</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {topPaths.map((row, i) => (
            <tr key={row.path}>
              <td>{i + 1}</td>
              <td className="path-cell">{row.path}</td>
              <td>{row.count.toLocaleString()}</td>
              <td>
                <div className="bar" style={{ width: `${(row.count / max) * 100}%` }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
