import { type RefObject, useEffect, useRef } from 'react'
import { collectLogFiles } from '../lib/fsUtils'
import type { SkippedEntry } from '../App'

const POLL_INTERVAL_MS = 10_000

export function useDirectoryWatch(
  dirHandles: FileSystemDirectoryHandle[],
  seenHashesRef: RefObject<Map<string, string>>,
  onNewFiles: (texts: string[], names: string[], skipped: SkippedEntry[]) => void,
) {
  const seenModifiedRef = useRef<Map<string, number>>(new Map())
  const callbackRef = useRef(onNewFiles)
  useEffect(() => { callbackRef.current = onNewFiles }, [onNewFiles])

  useEffect(() => {
    if (dirHandles.length === 0) {
      seenModifiedRef.current.clear()
      return
    }

    // Initial scan: mark existing files as seen so they are not re-analyzed
    for (const dirHandle of dirHandles) {
      collectLogFiles(dirHandle).then((files) => {
        files.forEach((f) =>
          seenModifiedRef.current.set(`${dirHandle.name}/${f.path}`, f.lastModified),
        )
      })
    }

    const poll = async () => {
      const allTexts: string[] = []
      const allNames: string[] = []
      const allSkipped: SkippedEntry[] = []

      for (const dirHandle of dirHandles) {
        const files = await collectLogFiles(dirHandle)
        const changedFiles = files.filter((f) => {
          const key = `${dirHandle.name}/${f.path}`
          const prev = seenModifiedRef.current.get(key)
          return prev === undefined || prev < f.lastModified
        })
        if (changedFiles.length === 0) continue

        changedFiles.forEach((f) =>
          seenModifiedRef.current.set(`${dirHandle.name}/${f.path}`, f.lastModified),
        )
        const seen = seenHashesRef.current
        const newFiles = changedFiles.filter((f) => !seen.has(f.hash))
        const skippedFiles: SkippedEntry[] = changedFiles
          .filter((f) => seen.has(f.hash))
          .map((f) => ({
            path: `${dirHandle.name}/${f.path}`,
            duplicateOf: seen.get(f.hash)!,
          }))
        newFiles.forEach((f) => seen.set(f.hash, `${dirHandle.name}/${f.path}`))

        allTexts.push(...newFiles.map((f) => f.text))
        allNames.push(...newFiles.map((f) => `${dirHandle.name}/${f.path}`))
        allSkipped.push(...skippedFiles)
      }

      if (allTexts.length > 0 || allSkipped.length > 0) {
        callbackRef.current(allTexts, allNames, allSkipped)
      }
    }

    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [dirHandles, seenHashesRef])
}
