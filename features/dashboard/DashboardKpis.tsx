"use client"

import { FolderKanban, ListTodo, AlertTriangle, Video } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/components/locale-provider"
import type { DashboardKpis as KpisData } from "./dashboard.types"
import { cn } from "@/lib/utils"

interface Props {
  kpis: KpisData
}

const KPI_CONFIG = [
  { key: "activeProjects" as const, icon: FolderKanban, accent: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
  { key: "openTasks" as const, icon: ListTodo, accent: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  { key: "overdueTasks" as const, icon: AlertTriangle, accent: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  { key: "meetingsThisWeek" as const, icon: Video, accent: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
]

export function DashboardKpis({ kpis }: Props) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-3 @lg:gap-4 lg:grid-cols-4">
      {KPI_CONFIG.map(({ key, icon: Icon, accent, bg }) => (
        <Card
          key={key}
          className="border-border/60 bg-card/80 backdrop-blur-sm transition-shadow hover:shadow-sm"
        >
          <CardContent className="flex items-center gap-3 p-4 @lg:p-5">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", bg)}>
              <Icon className={cn("h-5 w-5", accent)} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">{t(`dashboard.kpis.${key}`)}</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">{kpis[key]}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
