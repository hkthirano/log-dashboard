export interface FileEntry {
  name: string
  path: string  // フォルダ内の相対パス (例: subdir/access.log)
  text: string
  lastModified: number
  hash: string  // SHA-256 of file content (hex string)
}

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
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
      const text = await file.text()
      const hash = await sha256(text)
      results.push({ name: entry.name, path, text, lastModified: file.lastModified, hash })
    } else if (entry.kind === 'directory') {
      const subPrefix = prefix ? `${prefix}/${entry.name}` : entry.name
      const sub = await collectLogFiles(entry as FileSystemDirectoryHandle, subPrefix)
      results.push(...sub)
    }
  }
  return results
}
