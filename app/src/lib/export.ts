import { jsPDF } from 'jspdf'
import type { Stats } from '../types/log'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(2)} KB`
  return `${bytes} B`
}

// ---- CSV ----------------------------------------------------------------

export function exportCsv(stats: Stats) {
  const lines: string[] = []
  const now = new Date().toLocaleString('ja-JP')

  lines.push('# Log Dashboard - 解析サマリー')
  lines.push(`# 出力日時,${now}`)
  lines.push('')

  lines.push('## サマリー')
  lines.push('項目,値')
  lines.push(`総リクエスト数,${stats.totalRequests.toLocaleString()}`)
  lines.push(`ユニークIP数,${stats.uniqueIps.toLocaleString()}`)
  lines.push(`エラー率,${(stats.errorRate * 100).toFixed(1)}%`)
  lines.push(`総転送量,${formatBytes(stats.totalBytes)}`)
  lines.push('')

  lines.push('## 上位パス')
  lines.push('パス,リクエスト数')
  for (const { path, count } of stats.topPaths) {
    lines.push(`${path},${count}`)
  }
  lines.push('')

  lines.push('## ステータスコード')
  lines.push('ステータスコード,リクエスト数')
  for (const { status, count } of stats.statusCodes) {
    lines.push(`${status},${count}`)
  }

  const bom = '\uFEFF'
  const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const filename = `log-summary-${new Date().toISOString().slice(0, 10)}.csv`
  downloadBlob(blob, filename)
}

// ---- PDF ----------------------------------------------------------------

export function exportPdf(stats: Stats) {
  const doc = new jsPDF()
  const now = new Date().toLocaleString('ja-JP')
  const margin = 14
  let y = 20

  const addSection = (title: string) => {
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(title, margin, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
  }

  const addRow = (label: string, value: string, indent = 0) => {
    if (y > 275) { doc.addPage(); y = 20 }
    doc.text(label, margin + indent, y)
    doc.text(value, 120, y)
    y += 6
  }

  // Title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Log Dashboard - Summary', margin, y)
  y += 7
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120)
  doc.text(now, margin, y)
  doc.setTextColor(0)
  y += 10

  // Summary
  addSection('Summary')
  addRow('Total Requests', stats.totalRequests.toLocaleString())
  addRow('Unique IPs', stats.uniqueIps.toLocaleString())
  addRow('Error Rate', `${(stats.errorRate * 100).toFixed(1)}%`)
  addRow('Total Bytes', formatBytes(stats.totalBytes))
  y += 4

  // Top Paths
  addSection('Top Paths')
  addRow('Path', 'Count')
  doc.setDrawColor(180)
  doc.line(margin, y, 196, y)
  y += 4
  for (const { path, count } of stats.topPaths) {
    const label = path.length > 55 ? path.slice(0, 52) + '...' : path
    addRow(label, count.toLocaleString())
  }
  y += 4

  // Status Codes
  addSection('Status Codes')
  addRow('Status', 'Count')
  doc.line(margin, y, 196, y)
  y += 4
  for (const { status, count } of stats.statusCodes) {
    addRow(String(status), count.toLocaleString())
  }

  const filename = `log-summary-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
