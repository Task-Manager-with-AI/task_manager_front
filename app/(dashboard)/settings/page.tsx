"use client"

import { Globe } from "lucide-react"
import { useTranslation } from "@/components/locale-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Locale } from "@/lib/i18n/types"
import { NotificationPreferences } from "@/features/notifications/NotificationPreferences"

export default function SettingsPage() {
  const { t, locale, setLocale } = useTranslation()

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">{t("settings.title")}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("settings.subtitle")}</p>
        </div>

        <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Globe className="h-5 w-5" />
              {t("common.language")}
            </CardTitle>
            <CardDescription>{t("settings.languageDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="language-select">{t("common.language")}</Label>
              <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
                <SelectTrigger id="language-select" className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("common.english")}</SelectItem>
                  <SelectItem value="es">{t("common.spanish")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <NotificationPreferences />

        <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">{t("common.appearance")}</CardTitle>
            <CardDescription>{t("common.themeHint")}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
