"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQueries } from "@tanstack/react-query"
import { format } from "date-fns"
import { useTranslation } from "@/components/locale-provider"
import { useCurrentUser } from "@/features/auth/auth.hooks"
import { useProjects } from "@/features/projects/projects.hooks"
import { tasksApi } from "@/features/tasks/tasks.api"
import type { Task } from "@/features/tasks/tasks.types"
import { getColumnStyles, type KanbanColumnColor } from "@/features/kanban/kanban.types"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function MyTasksPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: currentUser } = useCurrentUser()
  const { data: projects, isLoading: projectsLoading } = useProjects()

  const taskQueries = useQueries({
    queries: (projects ?? []).map((project) => ({
      queryKey: ["tasks", project.id],
      queryFn: () => tasksApi.listByProject(project.id),
      enabled: Boolean(project.id),
    })),
  })

  const isLoadingTasks = taskQueries.some((query) => query.isLoading)
  const myTasks = useMemo(() => {
    if (!currentUser || !projects) return [] as Array<Task & { projectName: string }>

    return projects.flatMap((project, index) => {
      const tasks = taskQueries[index]?.data ?? []
      return tasks
        .filter((task) => task.responsibleId === currentUser.id)
        .map((task) => ({ ...task, projectName: project.name }))
    })
  }, [currentUser, projects, taskQueries])

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          {t("tasks.myTasksTitle")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("tasks.myTasksSubtitle")}</p>
      </div>

      {projectsLoading || isLoadingTasks ? (
        <Skeleton className="h-48 w-full" />
      ) : myTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800 sm:p-10">
          <p className="font-medium text-gray-900 dark:text-white">{t("tasks.noTasks")}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("tasks.noTasksHint")}</p>
        </div>
      ) : (
        <>
          {/* Desktop table — hidden on mobile */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 sm:block">
            <div className="table-responsive">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/60">
                    <TableHead>{t("tasks.titleLabel")}</TableHead>
                    <TableHead>{t("tasks.project")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("tasks.priority")}</TableHead>
                    <TableHead>{t("tasks.dueDate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myTasks.map((task) => (
                    <TableRow
                      key={task.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      onClick={() => router.push(`/projects/${task.projectId}`)}
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-white">{task.title}</TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">{task.projectName}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            getColumnStyles((task.column?.color as KanbanColumnColor) ?? "slate").badge
                          }
                        >
                          {task.column?.title ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>{task.priority}</TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile card list — hidden on sm+ */}
          <div className="space-y-3 sm:hidden">
            {myTasks.map((task) => (
              <button
                key={task.id}
                className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
                onClick={() => router.push(`/projects/${task.projectId}`)}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium text-gray-900 dark:text-white">{task.title}</p>
                  <Badge
                    className={
                      getColumnStyles((task.column?.color as KanbanColumnColor) ?? "slate").badge
                    }
                  >
                    {task.column?.title ?? "—"}
                  </Badge>
                </div>
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{task.projectName}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400 dark:text-gray-500">
                  <span>{t("tasks.priority")}: {task.priority}</span>
                  {task.dueDate && (
                    <span>{t("tasks.dueDate")}: {format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
