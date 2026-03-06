import { Button } from '@/components/ui/button'
import { collectLogFiles } from '../lib/fsUtils'

interface Props {
  onLoad: (texts: string[], fileNames: string[]) => void
  onWatchDir?: (handle: FileSystemDirectoryHandle) => void
  disabled: boolean
  label?: string
}

export function FilePicker({ onLoad, onWatchDir, disabled, label }: Props) {
  async function pickDirectory() {
    const dirHandle = await window.showDirectoryPicker()
    const results = await collectLogFiles(dirHandle)
    if (results.length === 0) {
      alert('フォルダ内に .log / .txt ファイルが見つかりませんでした')
      return
    }
    onLoad(results.map((r) => r.text), results.map((r) => r.name))
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
