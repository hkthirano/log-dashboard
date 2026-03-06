import { Button } from '@/components/ui/button'

interface Props {
  onLoad: (texts: string[], fileNames: string[]) => void
  disabled: boolean
  label?: string
}

async function collectLogFiles(dir: FileSystemDirectoryHandle): Promise<{ name: string; text: string }[]> {
  const results: { name: string; text: string }[] = []
  for await (const entry of dir.values()) {
    if (entry.kind === 'file' && /\.(log|txt)$/i.test(entry.name)) {
      const file = await (entry as FileSystemFileHandle).getFile()
      results.push({ name: entry.name, text: await file.text() })
    } else if (entry.kind === 'directory') {
      const sub = await collectLogFiles(entry as FileSystemDirectoryHandle)
      results.push(...sub)
    }
  }
  return results
}

export function FilePicker({ onLoad, disabled, label }: Props) {
  async function pickFiles() {
    const handles = await window.showOpenFilePicker({
      multiple: true,
      types: [{ description: 'Log files', accept: { 'text/plain': ['.log', '.txt'] } }],
    })
    const results = await Promise.all(
      handles.map(async (h) => {
        const file = await h.getFile()
        return { name: file.name, text: await file.text() }
      }),
    )
    onLoad(results.map((r) => r.text), results.map((r) => r.name))
  }

  async function pickDirectory() {
    const dirHandle = await window.showDirectoryPicker()
    const results = await collectLogFiles(dirHandle)
    if (results.length === 0) {
      alert('フォルダ内に .log / .txt ファイルが見つかりませんでした')
      return
    }
    onLoad(results.map((r) => r.text), results.map((r) => r.name))
  }

  if (label) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={pickFiles} disabled={disabled}>
          {label}（ファイル）
        </Button>
        <Button variant="outline" size="sm" onClick={pickDirectory} disabled={disabled}>
          {label}（フォルダ）
        </Button>
      </div>
    )
  }

  return (
    <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
      <p className="text-muted-foreground mb-5 text-sm">Apache アクセスログを選択してください</p>
      <div className="flex gap-3 justify-center">
        <Button onClick={pickFiles} disabled={disabled}>ファイルを選択</Button>
        <Button variant="outline" onClick={pickDirectory} disabled={disabled}>フォルダを選択</Button>
      </div>
    </div>
  )
}
