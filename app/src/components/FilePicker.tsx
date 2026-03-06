import type { RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { collectLogFiles } from '../lib/fsUtils'

interface Props {
  onLoad: (texts: string[], fileNames: string[], skipped: string[]) => void
  onWatchDir?: (handle: FileSystemDirectoryHandle) => void
  disabled: boolean
  label?: string
  seenHashesRef: RefObject<Set<string>>
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
    const skippedFiles = results.filter((r) => seen.has(r.hash))
    newFiles.forEach((r) => seen.add(r.hash))
    onLoad(
      newFiles.map((r) => r.text),
      newFiles.map((r) => `${dirHandle.name}/${r.path}`),
      skippedFiles.map((r) => `${dirHandle.name}/${r.path}`),
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
