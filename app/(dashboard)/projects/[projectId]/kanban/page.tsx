"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Settings2 } from "lucide-react"
import { useTranslation } from "@/components/locale-provider"
import { useProject, useProjectMembers } from "@/features/projects/projects.hooks"
import { useProjectTasks, useUpdateTaskColumn } from "@/features/tasks/tasks.hooks"
import { CreateTaskDialog } from "@/features/tasks/CreateTaskDialog"
import { KanbanBoard } from "@/features/kanban/KanbanBoard"
import { KanbanColumnSettingsSheet } from "@/features/kanban/KanbanColumnSettingsSheet"
import { TaskDetailModal } from "@/features/kanban/TaskDetailModal"
import { useKanbanColumns } from "@/features/kanban/kanban.hooks"
import type { Task } from "@/features/tasks/tasks.types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function KanbanPage() {
  const { t } = useTranslation()
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()

  const { data: project } = useProject(projectId)
  const { data: members, isLoading: membersLoading } = useProjectMembers(projectId)
  const { data: columns, isLoading: columnsLoading } = useKanbanColumns(projectId)
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(projectId)
  const { mutate: updateColumn } = useUpdateTaskColumn(projectId)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createColumnId, setCreateColumnId] = useState<string | undefined>()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const isLoading = columnsLoading || tasksLoading
  const sortedColumns = useMemo(
    () => [...(columns ?? [])].sort((a, b) => a.position - b.position),
    [columns]
  )

  const selectedColumn = sortedColumns.find((c) => c.id === selectedTask?.columnId)

  const handleColumnChange = (taskId: string, columnId: string) => {
    updateColumn({ taskId, columnId })
  }

  const handleAddTask = (columnId: string) => {
    setCreateColumnId(columnId)
    setCreateOpen(true)
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-blue-50/40 to-violet-100/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 top-0 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-600/10" />
        <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl dark:bg-blue-600/10" />
      </div>

      <div className="relative p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("common.backToProject")}
              onClick={() => router.push(`/projects/${projectId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("kanban.title")}</h1>
              {project && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {project.name}
                  {tasks && (
                    <span className="ml-2 text-gray-500 dark:text-gray-500">
                      · {t("kanban.taskCount").replace("{count}", String(tasks.length))}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="mr-2 h-4 w-4" />
            {t("kanban.configureBoard")}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 w-[280px] shrink-0 rounded-xl" />
            ))}
          </div>
        ) : sortedColumns.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("kanban.noColumns")}</p>
        ) : (
          <KanbanBoard
            columns={sortedColumns}
            tasks={tasks ?? []}
            onColumnChange={handleColumnChange}
            onAddTask={handleAddTask}
            onTaskClick={setSelectedTask}
          />
        )}
      </div>

      <KanbanColumnSettingsSheet
        projectId={projectId}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        columns={sortedColumns}
      />

      <CreateTaskDialog
        projectId={projectId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultColumnId={createColumnId}
        members={members}
        membersLoading={membersLoading}
      />

      <TaskDetailModal
        task={selectedTask}
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        column={selectedColumn}
      />
    </div>
  )
}
