export interface FileEntry {
  name: string
  path: string  // フォルダ内の相対パス (例: subdir/access.log)
  text: string
  lastModified: number
}

export async function collectLogFiles(
  dir: FileSystemDirectoryHandle,
  prefix = '',
): Promise<FileEntry[]> {
  const results: FileEntry[] = []
  for await (const entry of dir.values()) {
    if (entry.kind === 'file' && /\.(log|txt)$/i.test(entry.name)) {
      const file = await (entry as FileSystemFileHandle).getFile()
      const path = prefix ? `${prefix}/${entry.name}` : entry.name
      results.push({ name: entry.name, path, text: await file.text(), lastModified: file.lastModified })
    } else if (entry.kind === 'directory') {
      const subPrefix = prefix ? `${prefix}/${entry.name}` : entry.name
      const sub = await collectLogFiles(entry as FileSystemDirectoryHandle, subPrefix)
      results.push(...sub)
    }
  }
  return results
}
