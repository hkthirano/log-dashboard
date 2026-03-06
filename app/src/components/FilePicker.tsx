import type { RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { collectLogFiles } from '../lib/fsUtils'
import type { SkippedEntry } from '../App'

interface Props {
  onLoad: (texts: string[], fileNames: string[], skipped: SkippedEntry[]) => void
  onWatchDir: (handle: FileSystemDirectoryHandle) => void
  seenHashesRef: RefObject<Map<string, string>>
  label?: string
  disabled?: boolean
  variant?: 'outline' | 'default'
}

export function FilePicker({ onLoad, onWatchDir, seenHashesRef, label = 'フォルダを追加', disabled = false, variant = 'outline' }: Props) {
  async function pickDirectory() {
    const dirHandle = await window.showDirectoryPicker()
    const results = await collectLogFiles(dirHandle)
    const seen = seenHashesRef.current
    const newFiles = results.filter((r) => !seen.has(r.hash))
    const skippedFiles: SkippedEntry[] = results
      .filter((r) => seen.has(r.hash))
      .map((r) => ({ path: `${dirHandle.name}/${r.path}`, duplicateOf: seen.get(r.hash)! }))
    newFiles.forEach((r) => seen.set(r.hash, `${dirHandle.name}/${r.path}`))
    onLoad(
      newFiles.map((r) => r.text),
      newFiles.map((r) => `${dirHandle.name}/${r.path}`),
      skippedFiles,
    )
    onWatchDir(dirHandle)
  }

  return (
    <Button variant={variant} size="sm" onClick={pickDirectory} disabled={disabled}>
      {label}
    </Button>
  )
}

// 初回空状態で表示する大きいドロップゾーン
export function FilePickerDropZone({ onLoad, onWatchDir, seenHashesRef }: Omit<Props, 'label' | 'disabled' | 'variant'>) {
  async function pickDirectory() {
    const dirHandle = await window.showDirectoryPicker()
    const results = await collectLogFiles(dirHandle)
    if (results.length === 0) {
      alert('フォルダ内に .log / .txt ファイルが見つかりませんでした')
      return
    }
    const seen = seenHashesRef.current
    const newFiles = results.filter((r) => !seen.has(r.hash))
    const skippedFiles: SkippedEntry[] = results
      .filter((r) => seen.has(r.hash))
      .map((r) => ({ path: `${dirHandle.name}/${r.path}`, duplicateOf: seen.get(r.hash)! }))
    newFiles.forEach((r) => seen.set(r.hash, `${dirHandle.name}/${r.path}`))
    onLoad(
      newFiles.map((r) => r.text),
      newFiles.map((r) => `${dirHandle.name}/${r.path}`),
      skippedFiles,
    )
    onWatchDir(dirHandle)
  }

  return (
    <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
      <p className="text-muted-foreground mb-2 text-sm">Apache アクセスログのフォルダを選択してください</p>
      <p className="text-muted-foreground mb-5 text-xs">選択後、自動的に監視を開始します（10秒ごとに新規ファイルを検出）</p>
      <Button onClick={pickDirectory}>フォルダを選択して監視開始</Button>
    </div>
  )
}
