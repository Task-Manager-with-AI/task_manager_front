"use client"

type LogLevel = "debug" | "info" | "warn" | "error"
type LogScope = "ui" | "hook" | "api" | "editor"

type LogMeta = {
  event: string
  scope: LogScope
  projectId?: string
  documentId?: string
  threadId?: string
  suggestionId?: string
  versionId?: string
  assetId?: string
  jobId?: string
  status?: string | number
  durationMs?: number
  attempt?: number
  errorCode?: string | number
  message?: string
  count?: number
  sizeBytes?: number
  fileExtension?: string
}

const isDev = process.env.NODE_ENV === "development"

function safeMeta(meta: LogMeta) {
  return {
    ...meta,
    timestamp: new Date().toISOString(),
  }
}

function print(level: LogLevel, meta: LogMeta) {
  if (!isDev) return

  const payload = safeMeta(meta)
  const label = `[documents:${level}] ${meta.event}`

  if (level === "error") {
    console.error(label, payload)
    return
  }
  if (level === "warn") {
    console.warn(label, payload)
    return
  }
  if (level === "info") {
    console.info(label, payload)
    return
  }
  console.debug(label, payload)
}

export const documentsLogger = {
  debug(meta: LogMeta) {
    print("debug", meta)
  },
  info(meta: LogMeta) {
    print("info", meta)
  },
  warn(meta: LogMeta) {
    print("warn", meta)
  },
  error(meta: LogMeta) {
    print("error", meta)
  },
}

export function toShortErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 180)
  }
  if (typeof error === "string") {
    return error.slice(0, 180)
  }
  return "unknown_error"
}
