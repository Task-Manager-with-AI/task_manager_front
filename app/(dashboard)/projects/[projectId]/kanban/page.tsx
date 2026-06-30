"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Settings2, Zap, Clock, Target, CheckCircle2,
  AlertCircle, ListTodo,
} from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { useTranslation } from "@/components/locale-provider"
import { useProject, useProjectMembers } from "@/features/projects/projects.hooks"
import { useProjectTasks, useUpdateTaskColumn } from "@/features/tasks/tasks.hooks"
import { useActiveSprint, useCompleteSprint } from "@/features/sprints/sprints.hooks"
import { CreateTaskDialog } from "@/features/tasks/CreateTaskDialog"
import { KanbanBoard } from "@/features/kanban/KanbanBoard"
import { KanbanColumnSettingsSheet } from "@/features/kanban/KanbanColumnSettingsSheet"
import { TaskDetailModal } from "@/features/kanban/TaskDetailModal"
import { useKanbanColumns } from "@/features/kanban/kanban.hooks"
import type { Task } from "@/features/tasks/tasks.types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

function SprintBanner({
  sprint,
  tasks,
  onComplete,
  completing,
}: {
  sprint: { id: string; name: string; goal?: string | null; startDate: string; endDate: string; taskCount: number; totalPoints: number; completedPoints: number }
  tasks: Task[]
  onComplete: () => void
  completing: boolean
}) {
  const daysLeft = differenceInDays(new Date(sprint.endDate), new Date())
  const doneTasks = tasks.filter((t) => t.completedAt).length
  const totalTasks = tasks.length
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const isUrgent = daysLeft >= 0 && daysLeft <= 2

  return (
    <div className={cn(
      "mb-5 overflow-hidden rounded-xl border shadow-sm",
      isUrgent
        ? "border-amber-200 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-950/20"
        : "border-indigo-100 bg-indigo-50/60 dark:border-indigo-800/30 dark:bg-indigo-950/20"
    )}>
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 sm:flex-nowrap">
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          isUrgent ? "bg-amber-100 dark:bg-amber-900/30" : "bg-indigo-100 dark:bg-indigo-900/30"
        )}>
          <Zap className={cn("h-4 w-4", isUrgent ? "text-amber-600" : "text-indigo-600 dark:text-indigo-400")} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
              Sprint activo
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">{sprint.name}</span>
            {sprint.goal && (
              <span className="hidden truncate text-xs text-gray-500 dark:text-slate-400 sm:block">
                — {sprint.goal}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(sprint.startDate), "d MMM", { locale: es })} – {format(new Date(sprint.endDate), "d MMM", { locale: es })}
            </span>
            {daysLeft >= 0 ? (
              <span className={cn("flex items-center gap-1 font-medium", isUrgent ? "text-amber-600 dark:text-amber-400" : "text-indigo-500")}>
                <Target className="h-3 w-3" />
                {daysLeft === 0 ? "Último día" : `${daysLeft}d restantes`}
              </span>
            ) : (
              <span className="flex items-center gap-1 font-medium text-red-500">
                <AlertCircle className="h-3 w-3" />
                Vencido hace {Math.abs(daysLeft)}d
              </span>
            )}
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {doneTasks}/{totalTasks} tareas
            </span>
            {sprint.totalPoints > 0 && (
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {sprint.completedPoints}/{sprint.totalPoints}pt
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900/30">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progress === 100 ? "bg-emerald-500" : isUrgent ? "bg-amber-500" : "bg-indigo-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Button
          size="sm"
          className="shrink-0 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
          disabled={completing}
          onClick={onComplete}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Completar sprint</span>
          <span className="sm:hidden">Completar</span>
        </Button>
      </div>
    </div>
  )
}

export default function KanbanPage() {
  const { t } = useTranslation()
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()

  const { data: project } = useProject(projectId)
  const { data: members, isLoading: membersLoading } = useProjectMembers(projectId)
  const { data: columns, isLoading: columnsLoading } = useKanbanColumns(projectId)
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(projectId, "kanban")
  const { data: activeSprint, isLoading: sprintLoading } = useActiveSprint(projectId)
  const { mutate: updateColumn } = useUpdateTaskColumn(projectId)
  const { mutate: completeSprint, isPending: completingSprintPending } = useCompleteSprint(projectId)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createColumnId, setCreateColumnId] = useState<string | undefined>()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false)

  const isLoading = columnsLoading || tasksLoading || sprintLoading
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

  const handleCompleteSprint = () => {
    if (!activeSprint) return
    completeSprint(activeSprint.id, {
      onSuccess: () => {
        toast.success("Sprint completado. Las tareas sin terminar volvieron al backlog.")
        setConfirmCompleteOpen(false)
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Error al completar sprint"),
    })
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-blue-50/40 to-violet-100/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 top-0 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-600/10" />
        <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl dark:bg-blue-600/10" />
      </div>

      <div className="relative p-6">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
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
                  {activeSprint && (
                    <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {activeSprint.name}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}/backlog`)}
              className="gap-1.5"
            >
              <ListTodo className="h-4 w-4" />
              <span className="hidden sm:inline">Backlog</span>
            </Button>
            <Button variant="outline" onClick={() => setSettingsOpen(true)}>
              <Settings2 className="mr-2 h-4 w-4" />
              {t("kanban.configureBoard")}
            </Button>
          </div>
        </div>

        {/* Sprint banner */}
        {!sprintLoading && activeSprint && (
          <SprintBanner
            sprint={activeSprint}
            tasks={tasks ?? []}
            onComplete={() => setConfirmCompleteOpen(true)}
            completing={completingSprintPending}
          />
        )}

        {/* No active sprint notice */}
        {!sprintLoading && !activeSprint && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-800/30 dark:bg-amber-950/20">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1 text-sm text-amber-800 dark:text-amber-300">
              No hay una iteración activa.{" "}
              <button
                onClick={() => router.push(`/projects/${projectId}/backlog`)}
                className="font-semibold underline hover:no-underline"
              >
                Ve al Backlog para iniciar una.
              </button>
            </div>
          </div>
        )}

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

      <AlertDialog open={confirmCompleteOpen} onOpenChange={setConfirmCompleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Completar iteración
            </AlertDialogTitle>
            <AlertDialogDescription>
              Las tareas que no estén en la columna Done volverán al Product Backlog.
              Las tareas completadas quedan en el Incremento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleCompleteSprint}
              disabled={completingSprintPending}
            >
              Completar sprint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
