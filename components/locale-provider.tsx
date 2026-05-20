"use client"

import * as React from "react"
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n/types"
import { getMessage } from "@/lib/i18n/get-message"

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LocaleContext = React.createContext<LocaleContextValue | null>(null)

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  return stored === "es" ? "es" : DEFAULT_LOCALE
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(readStoredLocale)

  React.useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(LOCALE_STORAGE_KEY, next)
    document.documentElement.lang = next
  }, [])

  const t = React.useCallback(
    (key: string) => getMessage(locale, key),
    [locale]
  )

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useTranslation() {
  const context = React.useContext(LocaleContext)
  if (!context) {
    throw new Error("useTranslation must be used within LocaleProvider")
  }
  return context
}
