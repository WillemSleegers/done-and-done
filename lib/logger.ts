type LogLevel = "debug" | "info" | "warn" | "error"

const isDevelopment = process.env.NODE_ENV === "development"

const shouldLog = (level: LogLevel): boolean => {
  if (!isDevelopment) {
    return level === "error"
  }
  return true
}

export const logger = {
  debug: (message: string, ...args: unknown[]): void => {
    if (shouldLog("debug")) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  },

  info: (message: string, ...args: unknown[]): void => {
    if (shouldLog("info")) {
      console.log(`[INFO] ${message}`, ...args)
    }
  },

  warn: (message: string, ...args: unknown[]): void => {
    if (shouldLog("warn")) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },

  error: (message: string, ...args: unknown[]): void => {
    if (shouldLog("error")) {
      console.error(`[ERROR] ${message}`, ...args)
    }
  },

  userAction: (action: string, data?: unknown): void => {
    if (shouldLog("info")) {
      console.log(`[USER ACTION] ${action}`, data)
    }
  },

  sync: (message: string, data?: unknown): void => {
    if (shouldLog("debug")) {
      console.log(`[SYNC] ${message}`, data)
    }
  },

  auth: (message: string, data?: unknown): void => {
    if (shouldLog("info")) {
      console.log(`[AUTH] ${message}`, data)
    }
  },
}
