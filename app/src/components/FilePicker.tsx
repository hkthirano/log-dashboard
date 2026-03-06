import { collectLogFiles } from '../lib/fsUtils'

interface Props {
  onLoad: (texts: string[], fileNames: string[]) => void
  onWatchDir?: (handle: FileSystemDirectoryHandle) => void
  disabled: boolean
  label?: string
}

export function FilePicker({ onLoad, onWatchDir, disabled, label }: Props) {
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
    onWatchDir?.(dirHandle)
  }

  if (label) {
    return (
      <div className="file-picker-inline">
        <button onClick={pickFiles} disabled={disabled}>{label}（ファイル）</button>
        <button onClick={pickDirectory} disabled={disabled}>{label}（フォルダ）</button>
      </div>
    )
  }

  return (
    <div className="file-picker">
      <p className="file-picker-hint">Apache アクセスログを選択してください</p>
      <div className="file-picker-buttons">
        <button onClick={pickFiles} disabled={disabled}>ファイルを選択</button>
        <button onClick={pickDirectory} disabled={disabled}>フォルダを選択</button>
      </div>
    </div>
  )
}
