export interface FileEntry {
  name: string
  text: string
  lastModified: number
}

export async function collectLogFiles(dir: FileSystemDirectoryHandle): Promise<FileEntry[]> {
  const results: FileEntry[] = []
  for await (const entry of dir.values()) {
    if (entry.kind === 'file' && /\.(log|txt)$/i.test(entry.name)) {
      const file = await (entry as FileSystemFileHandle).getFile()
      results.push({ name: entry.name, text: await file.text(), lastModified: file.lastModified })
    } else if (entry.kind === 'directory') {
      const sub = await collectLogFiles(entry as FileSystemDirectoryHandle)
      results.push(...sub)
    }
  }
  return results
}
