export interface LogEntry {
  ip: string
  identity: string
  user: string
  timestamp: Date
  method: string
  path: string
  protocol: string
  status: number
  bytes: number
  referer: string
  userAgent: string
}

export interface Stats {
  totalRequests: number
  uniqueIps: number
  errorRate: number
  totalBytes: number
  topPaths: { path: string; count: number }[]
  statusCodes: { status: number; count: number }[]
  requestsPerHour: { hour: string; count: number }[]
}
