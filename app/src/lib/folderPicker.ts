import type { RefObject } from 'react'
import { collectLogFiles } from './fsUtils'
import type { SkippedEntry } from '../App'

type OnLoad = (texts: string[], fileNames: string[], skipped: SkippedEntry[]) => void
type OnWatchDir = (handle: FileSystemDirectoryHandle) => void

export async function pickAndLoad(
  seenHashesRef: RefObject<Map<string, string>>,
  onLoad: OnLoad,
  onWatchDir: OnWatchDir,
  requireFiles = false,
) {
  const dirHandle = await window.showDirectoryPicker({ startIn: 'downloads' })
  const results = await collectLogFiles(dirHandle)
  if (requireFiles && results.length === 0) {
    alert('No .log / .txt files found in folder')
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
