# Log Dashboard

A browser-based Apache access log analyzer. No server required — everything runs locally in your browser.

## Demo

https://white-river-02cd2e900.4.azurestaticapps.net/

## Features

- **100% local** — your log files are never uploaded anywhere; all parsing and analysis happens in-browser
- **Data persists across reloads** — analyzed data is stored locally (OPFS), so refreshing the page is safe
- **Folder monitoring** — select a folder and new or updated log files are detected automatically every 10 seconds
- **Multi-folder support** — monitor multiple directories simultaneously
- **Deduplication** — files with identical content are skipped automatically (SHA-256 hash comparison)
- **Reconnect after reload** — monitored folder handles are saved to IndexedDB; if permission is still granted, monitoring resumes automatically on the next visit
- **Rich analytics**
  - Total requests, unique IPs, error rate, data transferred
  - Requests per hour (bar chart)
  - Top paths by request count (horizontal bar chart)
  - Status code distribution (donut chart)
- **PDF export** — download a summary report
- **Sample data** — generate and download a realistic Apache log file to try the app instantly

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + shadcn/ui |
| SQL analytics | DuckDB-WASM (in-browser SQL engine) |
| Persistence | OPFS (DuckDB data), IndexedDB (directory handles), localStorage (file hashes + analysis log) |
| File access | File System Access API (`showDirectoryPicker`, `FileSystemDirectoryHandle`) |
| Charts | Recharts |
| PDF export | jsPDF |

## Privacy

Log files are opened directly from your local file system via the browser's File System Access API. No data is sent to any server at any point. Analysis results are stored in your browser's OPFS storage and persist across page reloads.

## Local Development

```bash
cd app
npm install
npm run dev
```

Open http://localhost:5173 in your browser. Use the "Download sample" button in the app to get test data, or point the folder picker at a directory containing `.log` / `.txt` Apache access log files.
