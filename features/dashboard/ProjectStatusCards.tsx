"use client"

import Link from "next/link"
import { ArrowUpRight, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useTranslation } from "@/components/locale-provider"
import type { DashboardProjectCard } from "./dashboard.types"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface Props {
  projects: DashboardProjectCard[]
}

const HEALTH_STYLES = {
  GREEN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  YELLOW: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  RED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

export function ProjectStatusCards({ projects }: Props) {
  const { t } = useTranslation()

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 py-10 text-center text-sm text-muted-foreground">
        {t("dashboard.noProjects")}
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin @lg:grid @lg:grid-cols-2 @lg:overflow-visible @xl:grid-cols-3">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="min-w-[260px] shrink-0 border-border/60 bg-card/90 @lg:min-w-0"
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="min-w-0 space-y-1">
              <CardTitle className="truncate text-base font-semibold">{project.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px]">
                  {project.status === "ACTIVE" ? t("projects.statusActive") : project.status}
                </Badge>
                {project.sprintHealth && (
                  <Badge className={cn("text-[10px]", HEALTH_STYLES[project.sprintHealth])}>
                    <Activity className="mr-1 h-3 w-3" />
                    {t(`dashboard.sprintHealth.${project.sprintHealth.toLowerCase()}`)}
                  </Badge>
                )}
              </div>
            </div>
            <Link
              href={`/projects/${project.id}`}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label={t("dashboard.openProject").replace("{name}", project.name)}
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("dashboard.progress")}</span>
                <span className="font-medium tabular-nums text-foreground">{project.progressPercent}%</span>
              </div>
              <Progress value={project.progressPercent} className="h-1.5" />
              <p className="text-[11px] text-muted-foreground">
                {project.doneTasks}/{project.totalTasks} {t("dashboard.tasksDone")}
              </p>
            </div>
            {project.activeSprint && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{project.activeSprint.name}</span>
                {" · "}
                {t("dashboard.sprintEnds")}{" "}
                {format(new Date(project.activeSprint.endDate), "d MMM")}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
