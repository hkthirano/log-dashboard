import { useEffect, useRef } from 'react'
import { collectLogFiles } from '../lib/fsUtils'

const POLL_INTERVAL_MS = 10_000

export function useDirectoryWatch(
  dirHandle: FileSystemDirectoryHandle | null,
  onNewFiles: (texts: string[], names: string[]) => void,
) {
  const seenRef = useRef<Map<string, number>>(new Map())
  const callbackRef = useRef(onNewFiles)
  callbackRef.current = onNewFiles

  useEffect(() => {
    if (!dirHandle) {
      seenRef.current.clear()
      return
    }

    // 初回スキャン: 既存ファイルを「既読」としてマーク（再解析しない）
    collectLogFiles(dirHandle).then((files) => {
      files.forEach((f) => seenRef.current.set(f.path, f.lastModified))
    })

    const poll = async () => {
      const files = await collectLogFiles(dirHandle)
      const newFiles = files.filter((f) => {
        const prev = seenRef.current.get(f.path)
        return prev === undefined || prev < f.lastModified
      })
      if (newFiles.length > 0) {
        newFiles.forEach((f) => seenRef.current.set(f.path, f.lastModified))
        callbackRef.current(
          newFiles.map((f) => f.text),
          newFiles.map((f) => `${dirHandle.name}/${f.path}`),
        )
      }
    }

    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [dirHandle])
}
