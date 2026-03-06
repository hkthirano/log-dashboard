const PATHS = [
  '/index.html', '/index.html', '/index.html',
  '/about.html', '/contact.html', '/products.html', '/products.html',
  '/api/users', '/api/users', '/api/products', '/api/orders',
  '/static/style.css', '/static/app.js', '/static/logo.png',
  '/login', '/logout', '/dashboard',
  '/admin/settings', '/admin/users',
  '/nonexistent.html', '/old-page.php',
]

const IPS = [
  '192.168.1.10', '192.168.1.10', '192.168.1.10',
  '10.0.0.5', '10.0.0.5',
  '203.0.113.42', '198.51.100.7', '172.16.0.3',
  '45.33.32.156', '93.184.216.34',
]

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'curl/7.88.1',
]

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function statusForPath(path: string): number {
  if (path === '/nonexistent.html') return 404
  if (path === '/old-page.php') return 301
  if (path === '/admin/settings' || path === '/admin/users') {
    return Math.random() < 0.3 ? 403 : 200
  }
  if (path.startsWith('/api/')) {
    const r = Math.random()
    if (r < 0.85) return 200
    if (r < 0.92) return 400
    return 500
  }
  return Math.random() < 0.97 ? 200 : 500
}

function formatDate(d: Date): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${months[d.getMonth()]}/${d.getFullYear()}:${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} +0000`
}

export function generateSampleLog(lines = 300): string {
  const entries: string[] = []
  // Generate log entries spanning the past 24 hours
  const end = Date.now()
  const start = end - 24 * 60 * 60 * 1000
  const timestamps = Array.from({ length: lines }, () => randInt(start, end)).sort((a, b) => a - b)

  for (const ts of timestamps) {
    const ip = rand(IPS)
    const path = rand(PATHS)
    const method = path.startsWith('/api/') && Math.random() < 0.3 ? 'POST' : 'GET'
    const status = statusForPath(path)
    const bytes = status === 301 ? 0 : status === 404 ? randInt(200, 500) : randInt(512, 51200)
    const ua = rand(USER_AGENTS)
    const date = formatDate(new Date(ts))
    entries.push(`${ip} - - [${date}] "${method} ${path} HTTP/1.1" ${status} ${bytes} "-" "${ua}"`)
  }
  return entries.join('\n')
}

export function downloadSampleLog(): void {
  const content = generateSampleLog(300)
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sample-access.log'
  a.click()
  URL.revokeObjectURL(url)
}
