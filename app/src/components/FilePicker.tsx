import type { RefObject } from 'react'
import { FolderOpen, BarChart2, RefreshCw, Download, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { collectLogFiles } from '../lib/fsUtils'
import { downloadSampleLog } from '../lib/sampleLog'
import type { SkippedEntry } from '../App'

interface Props {
  onLoad: (texts: string[], fileNames: string[], skipped: SkippedEntry[]) => void
  onWatchDir: (handle: FileSystemDirectoryHandle) => void
  seenHashesRef: RefObject<Map<string, string>>
  label?: string
  disabled?: boolean
  variant?: 'outline' | 'default'
}

async function pickAndLoad(
  seenHashesRef: RefObject<Map<string, string>>,
  onLoad: Props['onLoad'],
  onWatchDir: Props['onWatchDir'],
  requireFiles = false,
) {
  const dirHandle = await window.showDirectoryPicker()
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

export function FilePicker({ onLoad, onWatchDir, seenHashesRef, label = 'Add folder', disabled = false, variant = 'outline' }: Props) {
  return (
    <Button variant={variant} size="sm" onClick={() => pickAndLoad(seenHashesRef, onLoad, onWatchDir)} disabled={disabled}>
      {label}
    </Button>
  )
}

// Step card shown on the idle / empty screen
const STEPS = [
  {
    icon: Download,
    title: 'Get sample data',
    desc: 'Download a sample Apache log file to try the app instantly.',
    action: true,
  },
  {
    icon: FolderOpen,
    title: 'Select a folder',
    desc: 'Choose a folder containing .log or .txt Apache access log files.',
  },
  {
    icon: BarChart2,
    title: 'View analytics',
    desc: 'Explore request counts, top paths, status codes, and hourly trends.',
  },
  {
    icon: RefreshCw,
    title: 'Auto-monitor',
    desc: 'New or updated files are detected every 10 seconds automatically.',
  },
]

export function FilePickerDropZone({ onLoad, onWatchDir, seenHashesRef }: Omit<Props, 'label' | 'disabled' | 'variant'>) {
  return (
    <div className="w-full max-w-2xl flex flex-col gap-8">
      {/* How it works */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">How it works</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STEPS.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-border bg-card">
              {/* Step number */}
              <span className="absolute top-3 left-3 text-[10px] font-bold text-muted-foreground/50">{i + 1}</span>
              {/* Arrow connector */}
              {i < STEPS.length - 1 && (
                <span className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-muted-foreground/30">
                  <ArrowRight size={14} />
                </span>
              )}
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mt-2">
                <step.icon size={18} className="text-muted-foreground" />
              </div>
              <p className="text-xs font-semibold text-foreground leading-tight">{step.title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{step.desc}</p>
              {step.action && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-1 text-xs h-7 px-3"
                  onClick={downloadSampleLog}
                >
                  Download sample
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main CTA */}
      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center flex flex-col items-center gap-3">
        <FolderOpen size={32} className="text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium">Select your log folder</p>
          <p className="text-xs text-muted-foreground mt-1">
            Contains <span className="font-mono">.log</span> or <span className="font-mono">.txt</span> Apache access log files
          </p>
        </div>
        <Button
          className="mt-1"
          onClick={() => pickAndLoad(seenHashesRef, onLoad, onWatchDir, true)}
        >
          Select folder &amp; start monitoring
        </Button>
      </div>
    </div>
  )
}
