import { jsPDF } from 'jspdf'
import type { Stats } from '../types/log'


function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(2)} KB`
  return `${bytes} B`
}

// ---- PDF ----------------------------------------------------------------
// セクション順は画面と揃える:
// 1. Summary
// 2. Requests per Hour
// 3. Top Paths
// 4. Status Codes

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

  const addRow = (label: string, value: string) => {
    if (y > 275) { doc.addPage(); y = 20 }
    doc.text(label, margin, y)
    doc.text(value, 120, y)
    y += 6
  }

  const addDivider = () => {
    doc.setDrawColor(180)
    doc.line(margin, y, 196, y)
    y += 4
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

  // 1. Summary
  addSection('Summary')
  addRow('Total Requests', stats.totalRequests.toLocaleString())
  addRow('Unique IPs', stats.uniqueIps.toLocaleString())
  addRow('Error Rate', `${(stats.errorRate * 100).toFixed(1)}%`)
  addRow('Total Bytes', formatBytes(stats.totalBytes))
  y += 4

  // 2. Requests per Hour
  addSection('Requests per Hour')
  addRow('Hour', 'Count')
  addDivider()
  for (const { hour, count } of stats.requestsPerHour) {
    addRow(hour, count.toLocaleString())
  }
  y += 4

  // 3. Top Paths
  addSection('Top Paths')
  addRow('Path', 'Count')
  addDivider()
  for (const { path, count } of stats.topPaths) {
    const label = path.length > 55 ? path.slice(0, 52) + '...' : path
    addRow(label, count.toLocaleString())
  }
  y += 4

  // 4. Status Codes
  addSection('Status Codes')
  addRow('Status', 'Count')
  addDivider()
  for (const { status, count } of stats.statusCodes) {
    addRow(String(status), count.toLocaleString())
  }

  const filename = `log-summary-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
