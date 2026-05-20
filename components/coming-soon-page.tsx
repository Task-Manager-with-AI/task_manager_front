"use client"

import { Construction } from "lucide-react"
import { useTranslation } from "@/components/locale-provider"

interface ComingSoonPageProps {
  titleKey: string
  descriptionKey: string
}

export function ComingSoonPage({ titleKey, descriptionKey }: ComingSoonPageProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <Construction className="mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t(titleKey)}</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">{t(descriptionKey)}</p>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
        {t("common.comingSoon")}
      </p>
    </div>
  )
}
