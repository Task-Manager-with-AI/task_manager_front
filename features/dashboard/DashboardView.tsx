"use client"

import { useState } from "react"
import { LayoutDashboard } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/components/locale-provider"
import { useCurrentUser } from "@/features/auth/auth.hooks"
import { useDashboardOverview } from "./dashboard.hooks"
import { DashboardKpis } from "./DashboardKpis"
import { ProjectStatusCards } from "./ProjectStatusCards"
import { BurndownChart } from "./BurndownChart"
import { BurnupChart } from "./BurnupChart"
import { TasksByColumnChart } from "./TasksByColumnChart"
import { TasksByPriorityChart } from "./TasksByPriorityChart"
import { WeeklyVelocityChart } from "./WeeklyVelocityChart"
import { DashboardCalendarPanel } from "./DashboardCalendarPanel"

export function DashboardView() {
  const { t } = useTranslation()
  const { data: user } = useCurrentUser()
  const [projectFilter, setProjectFilter] = useState<string>("all")

  const projectId = projectFilter === "all" ? undefined : projectFilter
  const { data, isLoading, isError } = useDashboardOverview(projectId)

  const firstName = user?.name?.split(" ")[0] ?? t("dashboard.guest")

  return (
    <div className="@container flex flex-col gap-6 p-[var(--space-page-x)] pb-10">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <LayoutDashboard className="h-5 w-5" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-widest">{t("dashboard.title")}</span>
          </div>
          <h1 className="text-[length:var(--text-2xl)] font-bold tracking-tight">
            {t("dashboard.greeting").replace("{name}", firstName)}
          </h1>
          <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>

        {data && data.projects.length > 0 && (
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-[220px]" aria-label={t("dashboard.filterProject")}>
              <SelectValue placeholder={t("dashboard.allProjects")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dashboard.allProjects")}</SelectItem>
              {data.projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </header>

      {isLoading && <DashboardSkeleton />}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive">
          {t("dashboard.loadError")}
        </div>
      )}

      {!isLoading && data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(280px,320px)] lg:items-start">
          {/* Main column */}
          <div className="flex flex-col gap-6 min-w-0">
            <DashboardKpis kpis={data.kpis} />

            <section aria-labelledby="projects-heading">
              <h2 id="projects-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("dashboard.projectsSection")}
              </h2>
              <ProjectStatusCards projects={data.projects} />
            </section>

            <section className="grid grid-cols-1 gap-4 @lg:grid-cols-2" aria-label={t("dashboard.chartsSection")}>
              <BurndownChart data={data.burndown} />
              <BurnupChart data={data.burnup} />
              <TasksByColumnChart data={data.tasksByColumn} />
              <TasksByPriorityChart data={data.tasksByPriority} />
            </section>

            <WeeklyVelocityChart data={data.weeklyVelocity} />
          </div>

          {/* Sidebar — below charts on mobile */}
          <aside className="min-w-0">
            <DashboardCalendarPanel projectId={projectId} />
          </aside>
        </div>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 min-w-[260px] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <Skeleton className="h-[520px] rounded-xl" />
    </div>
  )
}
