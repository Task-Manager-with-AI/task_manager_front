import type { Locale } from "./types"
import en from "./messages/en.json"
import es from "./messages/es.json"

const messages: Record<Locale, Record<string, unknown>> = { en, es }

export function getMessage(locale: Locale, key: string): string {
  const parts = key.split(".")
  let current: unknown = messages[locale]

  for (const part of parts) {
    if (typeof current !== "object" || current === null) return key
    current = (current as Record<string, unknown>)[part]
  }

  return typeof current === "string" ? current : key
}
