"use client"

import { useEffect } from "react"
import { useTranslation } from "@/components/locale-provider"

export function DocumentTitle() {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = t("brand.name")
  }, [t])

  return null
}
