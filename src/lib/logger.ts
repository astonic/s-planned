// ── Structured Server Logging ─────────────────────────────────────────────────
// All logs are JSON-formatted for structured log analysis
// Typical log entry: { timestamp, level, orgId, userId, requestId, message, data }

export interface LogContext {
  orgId?: string
  userId?: string
  requestId?: string
}

export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  orgId?: string
  userId?: string
  requestId?: string
  message: string
  data?: Record<string, unknown>
}

class Logger {
  private context: LogContext

  constructor(context: LogContext = {}) {
    this.context = context
  }

  setContext(context: Partial<LogContext>) {
    this.context = { ...this.context, ...context }
  }

  private format(level: string, message: string, data?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: level as LogEntry['level'],
      orgId: this.context.orgId,
      userId: this.context.userId,
      requestId: this.context.requestId,
      message,
      ...(data && Object.keys(data).length > 0 ? { data } : {}),
    }
  }

  private output(entry: LogEntry) {
    // Always log as JSON to stdout for log aggregation systems
    console.log(JSON.stringify(entry))
  }

  info(message: string, data?: Record<string, unknown>) {
    this.output(this.format('info', message, data))
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.output(this.format('warn', message, data))
  }

  error(message: string, data?: Record<string, unknown>) {
    this.output(this.format('error', message, data))
  }

  debug(message: string, data?: Record<string, unknown>) {
    // Only output debug logs if DEBUG env var is set
    if (process.env.DEBUG) {
      this.output(this.format('debug', message, data))
    }
  }
}

// ── Global singleton with no context (safe for module init) ──────────────────

export const logger = new Logger()

// ── Factory for creating contextual loggers ─────────────────────────────────

export function createLogger(context?: LogContext): Logger {
  const l = new Logger(context ?? {})
  return l
}
