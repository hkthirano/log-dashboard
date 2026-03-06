import { type RefObject, useEffect, useRef, useState } from 'react'
import { collectLogFiles } from '../lib/fsUtils'
import type { SkippedEntry } from '../App'

const POLL_INTERVAL_MS = 10_000
const POLL_INTERVAL_S = POLL_INTERVAL_MS / 1000

export function useDirectoryWatch(
  dirHandle: FileSystemDirectoryHandle | null,
  seenHashesRef: RefObject<Map<string, string>>,
  onNewFiles: (texts: string[], names: string[], skipped: SkippedEntry[]) => void,
): { countdown: number } {
  const seenModifiedRef = useRef<Map<string, number>>(new Map())
  const callbackRef = useRef(onNewFiles)
  const lastPollAtRef = useRef(0)
  const [countdown, setCountdown] = useState(POLL_INTERVAL_S)

  useEffect(() => { callbackRef.current = onNewFiles }, [onNewFiles])

  useEffect(() => {
    if (!dirHandle) {
      seenModifiedRef.current.clear()
      return
    }

    // Initial scan: mark existing files as seen so they are not re-analyzed
    collectLogFiles(dirHandle).then((files) => {
      files.forEach((f) =>
        seenModifiedRef.current.set(`${dirHandle.name}/${f.path}`, f.lastModified),
      )
    })

    // Ref mutation is fine in effect body
    lastPollAtRef.current = Date.now()

    const poll = async () => {
      // setState inside async callback — not a synchronous effect setState
      lastPollAtRef.current = Date.now()
      setCountdown(POLL_INTERVAL_S)

      const files = await collectLogFiles(dirHandle)
      const changedFiles = files.filter((f) => {
        const key = `${dirHandle.name}/${f.path}`
        const prev = seenModifiedRef.current.get(key)
        return prev === undefined || prev < f.lastModified
      })
      if (changedFiles.length === 0) return

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

      if (newFiles.length > 0 || skippedFiles.length > 0) {
        callbackRef.current(
          newFiles.map((f) => f.text),
          newFiles.map((f) => `${dirHandle.name}/${f.path}`),
          skippedFiles,
        )
      }
    }

    const pollId = setInterval(poll, POLL_INTERVAL_MS)
    // Tick every second to update the countdown display
    const tickId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastPollAtRef.current) / 1000)
      setCountdown(Math.max(0, POLL_INTERVAL_S - elapsed))
    }, 1000)

    return () => {
      clearInterval(pollId)
      clearInterval(tickId)
    }
  }, [dirHandle, seenHashesRef])

  return { countdown }
}
