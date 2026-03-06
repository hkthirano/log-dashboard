import { type RefObject, useEffect, useRef } from 'react'
import { collectLogFiles } from '../lib/fsUtils'
import type { SkippedEntry } from '../App'

const POLL_INTERVAL_MS = 10_000

export function useDirectoryWatch(
  dirHandle: FileSystemDirectoryHandle | null,
  seenHashesRef: RefObject<Map<string, string>>,
  onNewFiles: (texts: string[], names: string[], skipped: SkippedEntry[]) => void,
) {
  const seenModifiedRef = useRef<Map<string, number>>(new Map())
  const callbackRef = useRef(onNewFiles)
  useEffect(() => { callbackRef.current = onNewFiles }, [onNewFiles])

  useEffect(() => {
    if (!dirHandle) {
      seenModifiedRef.current.clear()
      return
    }

    // 初回スキャン: 既存ファイルを「既読」としてマーク（再解析しない）
    collectLogFiles(dirHandle).then((files) => {
      files.forEach((f) => seenModifiedRef.current.set(f.path, f.lastModified))
    })

    const poll = async () => {
      const files = await collectLogFiles(dirHandle)
      const changedFiles = files.filter((f) => {
        const prev = seenModifiedRef.current.get(f.path)
        return prev === undefined || prev < f.lastModified
      })
      if (changedFiles.length > 0) {
        changedFiles.forEach((f) => seenModifiedRef.current.set(f.path, f.lastModified))
        const seen = seenHashesRef.current
        const newFiles = changedFiles.filter((f) => !seen.has(f.hash))
        const skippedFiles: SkippedEntry[] = changedFiles
          .filter((f) => seen.has(f.hash))
          .map((f) => ({
            path: `${dirHandle.name}/${f.path}`,
            duplicateOf: seen.get(f.hash)!,
          }))
        newFiles.forEach((f) => seen.set(f.hash, `${dirHandle.name}/${f.path}`))
        callbackRef.current(
          newFiles.map((f) => f.text),
          newFiles.map((f) => `${dirHandle.name}/${f.path}`),
          skippedFiles,
        )
      }
    }

    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [dirHandle, seenHashesRef])
}
