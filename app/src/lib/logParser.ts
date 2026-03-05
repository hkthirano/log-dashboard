import type { LogEntry } from '../types/log'

// Apache Combined Log Format:
// %h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\"
// Apache Common Log Format (no referer/UA):
// %h %l %u %t \"%r\" %>s %b
const COMBINED_RE =
  /^(\S+) (\S+) (\S+) \[([^\]]+)\] "(\S+) (\S+) (\S+)" (\d+) (\S+)(?: "([^"]*)" "([^"]*)")?/

const TIMESTAMP_RE = /(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-]\d{4})/

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

function parseTimestamp(raw: string): Date {
  const m = TIMESTAMP_RE.exec(raw)
  if (!m) return new Date(NaN)
  const [, day, mon, year, hh, mm, ss, tz] = m
  const tzOffset = parseInt(tz.slice(0, 3)) * 60 + parseInt(tz.slice(3))
  const utcMs =
    Date.UTC(+year, MONTHS[mon], +day, +hh, +mm, +ss) - tzOffset * 60000
  return new Date(utcMs)
}

export function parseLine(line: string): LogEntry | null {
  const m = COMBINED_RE.exec(line.trim())
  if (!m) return null
  const [, ip, identity, user, ts, method, path, protocol, status, bytesRaw, referer = '-', userAgent = '-'] = m
  return {
    ip,
    identity,
    user,
    timestamp: parseTimestamp(ts),
    method,
    path,
    protocol,
    status: parseInt(status),
    bytes: bytesRaw === '-' ? 0 : parseInt(bytesRaw),
    referer,
    userAgent,
  }
}

export function parseText(text: string): LogEntry[] {
  const entries: LogEntry[] = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    const entry = parseLine(line)
    if (entry) entries.push(entry)
  }
  return entries
}
