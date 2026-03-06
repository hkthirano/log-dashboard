import type { RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { collectLogFiles } from '../lib/fsUtils'
import type { SkippedEntry } from '../App'

interface Props {
  onLoad: (texts: string[], fileNames: string[], skipped: SkippedEntry[]) => void
  onWatchDir?: (handle: FileSystemDirectoryHandle) => void
  disabled: boolean
  label?: string
  seenHashesRef: RefObject<Map<string, string>>
}

export function FilePicker({ onLoad, onWatchDir, disabled, label, seenHashesRef }: Props) {
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
    onWatchDir?.(dirHandle)
  }

  if (label) {
    return (
      <Button variant="outline" size="sm" onClick={pickDirectory} disabled={disabled}>
        {label}
      </Button>
    )
  }

  return (
    <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
      <p className="text-muted-foreground mb-5 text-sm">Apache アクセスログのフォルダを選択してください</p>
      <Button onClick={pickDirectory} disabled={disabled}>フォルダを選択</Button>
    </div>
  )
}
