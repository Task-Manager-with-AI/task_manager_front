"use client"

import { useState } from "react"
import { Bell, BellOff, Smartphone } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  useNotificationPreferences,
  useUpdatePreferences,
} from "./notifications.hooks"
import type { NotificationCategory, NotificationPreference } from "./notifications.types"
import { enablePush, isPushSupported } from "./push"

const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  PROJECT: "Proyectos",
  MEETING: "Reuniones",
  TASK: "Tareas",
  DOCUMENT: "Documentos",
  CHAT: "Chat",
  AI: "IA / Copiloto",
  SYSTEM: "Sistema",
}

export function NotificationPreferences() {
  const { data: prefs, isLoading } = useNotificationPreferences()
  const { mutate: update } = useUpdatePreferences()
  const [enabling, setEnabling] = useState(false)

  const toggle = (
    pref: NotificationPreference,
    channel: "inApp" | "push",
    value: boolean
  ) => {
    update([{ ...pref, [channel]: value }])
  }

  const handleEnablePush = async () => {
    setEnabling(true)
    try {
      await enablePush()
      toast.success("Notificaciones del navegador activadas")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setEnabling(false)
    }
  }

  return (
    <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Bell className="h-5 w-5" />
          Notificaciones
        </CardTitle>
        <CardDescription>
          Elige qué avisos quieres recibir dentro de la app y en el navegador.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPushSupported() && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-violet-200 bg-violet-50/50 px-3 py-2.5 dark:border-violet-900/40 dark:bg-violet-950/20">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Smartphone className="h-4 w-4" />
              Notificaciones del navegador (push)
            </div>
            <Button size="sm" variant="outline" onClick={handleEnablePush} disabled={enabling}>
              {enabling ? "Activando…" : "Activar"}
            </Button>
          </div>
        )}

        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>Categoría</span>
          <span className="text-center">En la app</span>
          <span className="text-center">Push</span>
        </div>

        {isLoading || !prefs ? (
          <p className="py-4 text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {prefs.map((pref) => (
              <li
                key={pref.category}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                  {pref.inApp ? (
                    <Bell className="h-3.5 w-3.5 text-gray-400" />
                  ) : (
                    <BellOff className="h-3.5 w-3.5 text-gray-400" />
                  )}
                  {CATEGORY_LABEL[pref.category]}
                </span>
                <div className="flex justify-center">
                  <Switch
                    checked={pref.inApp}
                    onCheckedChange={(v) => toggle(pref, "inApp", v)}
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={pref.push}
                    onCheckedChange={(v) => toggle(pref, "push", v)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
