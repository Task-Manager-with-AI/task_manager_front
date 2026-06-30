"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import {
  ArrowLeft, Plus, CheckSquare2, Square, ChevronDown, ChevronUp,
  Play, CheckCircle2, Trash2, Pencil, PackageCheck, ListTodo,
  Trophy, AlertCircle, Zap, Clock, Target, X, BarChart3,
} from "lucide-react"
import { useProject, useProjectMembers } from "@/features/projects/projects.hooks"
import { useBacklogTasks, useDeleteTask } from "@/features/tasks/tasks.hooks"
import { CreateTaskDialog } from "@/features/tasks/CreateTaskDialog"
import {
  useProjectSprints,
  useCreateSprint,
  useUpdateSprint,
  useStartSprint,
  useCompleteSprint,
  useDeleteSprint,
  useAssignSprintTasks,
} from "@/features/sprints/sprints.hooks"
import type { Task } from "@/features/tasks/tasks.types"
import type { Sprint } from "@/features/sprints/sprints.types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ─── helpers ────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

const PRIORITY_CONFIG = {
  LOW:    { label: "Baja",  dot: "bg-slate-400",  badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  MEDIUM: { label: "Media", dot: "bg-amber-400",  badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  HIGH:   { label: "Alta",  dot: "bg-red-500",    badge: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
}

const SPRINT_CONFIG = {
  ACTIVE:    { border: "border-l-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-950/40",     label: "Activo",  labelCls: "bg-indigo-500 text-white" },
  PLANNED:   { border: "border-l-slate-400",   bg: "bg-white dark:bg-slate-900",              label: "Planif.", labelCls: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
  COMPLETED: { border: "border-l-emerald-500", bg: "bg-emerald-50/50 dark:bg-emerald-950/20", label: "Hecho",  labelCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
}

// ─── task row ───────────────────────────────────────────────────────────────

function TaskRow({
  task,
  selected,
  onToggle,
  onDelete,
  showDelete = true,
  showCheckbox = true,
}: {
  task: Task
  selected?: boolean
  onToggle?: () => void
  onDelete?: () => void
  showDelete?: boolean
  showCheckbox?: boolean
}) {
  const pri = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.MEDIUM
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-all",
        "border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900/60",
        selected && "border-indigo-300 bg-indigo-50/60 dark:border-indigo-700 dark:bg-indigo-950/40"
      )}
    >
      {showCheckbox && (
        <button
          onClick={onToggle}
          className="shrink-0 text-gray-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400"
        >
          {selected ? (
            <CheckSquare2 className="h-4 w-4 text-indigo-500" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>
      )}

      <span className={cn("h-2 w-2 shrink-0 rounded-full", pri.dot)} title={pri.label} />

      <span className="min-w-0 flex-1 truncate font-medium text-gray-800 dark:text-slate-100">
        {task.title}
      </span>

      {(task.storyPoints ?? 0) > 0 && (
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-slate-800 dark:text-slate-400">
          {task.storyPoints}pt
        </span>
      )}

      {task.responsible && (
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
            {initials(task.responsible.name)}
          </AvatarFallback>
        </Avatar>
      )}

      {task.dueDate && (
        <span className="hidden shrink-0 text-xs text-gray-400 dark:text-slate-500 sm:block">
          {format(new Date(task.dueDate), "d MMM", { locale: es })}
        </span>
      )}

      {showDelete && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="hidden shrink-0 text-gray-300 hover:text-red-500 dark:text-slate-600 group-hover:block dark:hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

// ─── sprint card ─────────────────────────────────────────────────────────────

function SprintCard({
  sprint,
  onStart,
  onComplete,
  onDelete,
  onEdit,
  onRemoveTask,
  startPending,
  completePending,
}: {
  sprint: Sprint
  onStart: () => void
  onComplete: () => void
  onDelete: () => void
  onEdit: () => void
  onRemoveTask: (taskId: string) => void
  startPending: boolean
  completePending: boolean
}) {
  const [expanded, setExpanded] = useState(sprint.status !== "COMPLETED")
  const cfg = SPRINT_CONFIG[sprint.status]
  const daysLeft = differenceInDays(new Date(sprint.endDate), new Date())
  const progress = sprint.totalPoints > 0
    ? Math.round((sprint.completedPoints / sprint.totalPoints) * 100)
    : 0
  const tasks = sprint.tasks ?? []

  return (
    <div className={cn(
      "rounded-xl border-l-4 shadow-sm overflow-hidden",
      "border border-gray-100 dark:border-slate-800",
      cfg.border, cfg.bg
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", cfg.labelCls)}>
              {cfg.label}
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">{sprint.name}</span>
          </div>
          {sprint.goal && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400 line-clamp-1">{sprint.goal}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(sprint.startDate), "d MMM", { locale: es })} – {format(new Date(sprint.endDate), "d MMM yyyy", { locale: es })}
            </span>
            {sprint.status === "ACTIVE" && daysLeft >= 0 && (
              <span className={cn("flex items-center gap-1 font-medium", daysLeft <= 2 ? "text-red-500" : "text-indigo-500 dark:text-indigo-400")}>
                <Target className="h-3 w-3" />
                {daysLeft === 0 ? "Hoy es el último día" : `${daysLeft}d restantes`}
              </span>
            )}
            <span className="flex items-center gap-1">
              <ListTodo className="h-3 w-3" />
              {sprint.taskCount} {sprint.taskCount === 1 ? "tarea" : "tareas"}
            </span>
            {sprint.totalPoints > 0 && (
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {sprint.completedPoints}/{sprint.totalPoints}pt
              </span>
            )}
          </div>

          {sprint.status === "ACTIVE" && sprint.totalPoints > 0 && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {sprint.status === "PLANNED" && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-gray-400 hover:text-indigo-600"
                onClick={(e) => { e.stopPropagation(); onEdit() }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                onClick={(e) => { e.stopPropagation(); onDelete() }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                className="h-7 gap-1 bg-indigo-600 px-3 text-xs text-white hover:bg-indigo-700"
                disabled={sprint.taskCount === 0 || startPending}
                onClick={(e) => { e.stopPropagation(); onStart() }}
              >
                <Play className="h-3 w-3" />
                Iniciar
              </Button>
            </>
          )}
          {sprint.status === "ACTIVE" && (
            <Button
              size="sm"
              className="h-7 gap-1 bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700"
              disabled={completePending}
              onClick={(e) => { e.stopPropagation(); onComplete() }}
            >
              <CheckCircle2 className="h-3 w-3" />
              Completar
            </Button>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Tasks */}
      {expanded && tasks.length > 0 && (
        <div className="space-y-1.5 border-t border-gray-100 px-4 pb-4 pt-3 dark:border-slate-800">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              showCheckbox={false}
              showDelete={sprint.status !== "ACTIVE"}
              onDelete={() => onRemoveTask(task.id)}
            />
          ))}
        </div>
      )}

      {expanded && tasks.length === 0 && (
        <div className="border-t border-gray-100 px-4 py-6 dark:border-slate-800">
          <p className="text-center text-xs text-gray-400 dark:text-slate-500">
            Sin tareas — selecciona del backlog y agrégalas
          </p>
        </div>
      )}
    </div>
  )
}

// ─── sprint form schema ───────────────────────────────────────────────────────

const sprintFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  goal: z.string().optional(),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de fin es requerida"),
})
type SprintForm = z.infer<typeof sprintFormSchema>

// ─── main page ───────────────────────────────────────────────────────────────

export default function BacklogPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") ?? "backlog"

  const { data: project } = useProject(projectId)
  const { data: members } = useProjectMembers(projectId)
  const { data: backlog = [], isLoading: backlogLoading } = useBacklogTasks(projectId)
  const { data: sprints = [], isLoading: sprintsLoading } = useProjectSprints(projectId)

  const { mutate: deleteTask } = useDeleteTask(projectId)
  const { mutate: createSprint, isPending: creatingSprint } = useCreateSprint(projectId)
  const { mutate: updateSprint } = useUpdateSprint(projectId)
  const { mutate: startSprint } = useStartSprint(projectId)
  const { mutate: completeSprint } = useCompleteSprint(projectId)
  const { mutate: deleteSprint } = useDeleteSprint(projectId)
  const { mutate: assignTasks } = useAssignSprintTasks(projectId)

  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [sprintModalOpen, setSprintModalOpen] = useState(false)
  const [editSprint, setEditSprint] = useState<Sprint | null>(null)
  const [confirmComplete, setConfirmComplete] = useState<Sprint | null>(null)
  const [confirmDeleteSprint, setConfirmDeleteSprint] = useState<Sprint | null>(null)

  const sprintForm = useForm<SprintForm>({
    resolver: zodResolver(sprintFormSchema),
    defaultValues: { name: "", goal: "", startDate: "", endDate: "" },
  })

  const toggleTask = (id: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedTaskIds(new Set(backlog.map((t) => t.id)))
  const clearSelection = () => setSelectedTaskIds(new Set())

  const handleAddToSprint = (sprintId: string) => {
    if (selectedTaskIds.size === 0) return
    assignTasks(
      { sprintId, dto: { taskIds: [...selectedTaskIds], action: "add" } },
      {
        onSuccess: () => {
          toast.success(`${selectedTaskIds.size} tarea(s) añadida(s) al sprint`)
          clearSelection()
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Error al añadir tareas"),
      }
    )
  }

  const handleRemoveFromSprint = (sprintId: string, taskId: string) => {
    assignTasks(
      { sprintId, dto: { taskIds: [taskId], action: "remove" } },
      { onSuccess: () => toast.success("Tarea devuelta al backlog") }
    )
  }

  const handleCreateSprint = (data: SprintForm) => {
    const dto = {
      name: data.name.trim(),
      goal: data.goal?.trim() || undefined,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
    }
    if (editSprint) {
      updateSprint(
        { sprintId: editSprint.id, dto },
        {
          onSuccess: () => { setSprintModalOpen(false); setEditSprint(null); sprintForm.reset() },
          onError: (e) => toast.error(e instanceof Error ? e.message : "Error al actualizar"),
        }
      )
    } else {
      createSprint(dto, {
        onSuccess: () => { setSprintModalOpen(false); sprintForm.reset() },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Error al crear la iteración"),
      })
    }
  }

  const openEditSprint = (sprint: Sprint) => {
    setEditSprint(sprint)
    sprintForm.reset({
      name: sprint.name,
      goal: sprint.goal ?? "",
      startDate: sprint.startDate.slice(0, 10),
      endDate: sprint.endDate.slice(0, 10),
    })
    setSprintModalOpen(true)
  }

  const handleStartSprint = (sprintId: string) => {
    startSprint(sprintId, {
      onSuccess: () => toast.success("¡Iteración iniciada! Las tareas están en el Kanban."),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Error al iniciar"),
    })
  }

  const handleConfirmComplete = () => {
    if (!confirmComplete) return
    completeSprint(confirmComplete.id, {
      onSuccess: () => {
        toast.success("Iteración completada.")
        setConfirmComplete(null)
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Error al completar"),
    })
  }

  const handleConfirmDeleteSprint = () => {
    if (!confirmDeleteSprint) return
    deleteSprint(confirmDeleteSprint.id, {
      onSuccess: () => { toast.success("Iteración eliminada"); setConfirmDeleteSprint(null) },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Error al eliminar"),
    })
  }

  const completedSprints = useMemo(() => sprints.filter((s) => s.status === "COMPLETED"), [sprints])
  const isLoading = backlogLoading || sprintsLoading
  const plannedAndActive = sprints.filter((s) => s.status !== "COMPLETED")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      {/* Page header */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.push(`/projects/${projectId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex min-w-0 items-center gap-2">
            <ListTodo className="h-5 w-5 shrink-0 text-indigo-500" />
            <div className="min-w-0">
              <h1 className="text-base font-bold leading-none text-gray-900 dark:text-white">
                Bolsa de Tareas
              </h1>
              {project && (
                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-slate-400">{project.name}</p>
              )}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-slate-700 dark:bg-slate-900">
              {[
                { key: "backlog", label: "Planificación", icon: ListTodo },
                { key: "increment", label: "Completados", icon: Trophy },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => router.push(`/projects/${projectId}/backlog?tab=${key}`)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                    tab === key
                      ? "bg-white text-gray-900 shadow-sm dark:bg-slate-800 dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* ── TAB: Incremento ─────────────────────────────────────────────── */}
        {tab === "increment" && (
          <div className="mx-auto max-w-3xl">
            <div className="mb-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <Trophy className="h-5 w-5 text-amber-500" />
                Completados
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Trabajo entregado en iteraciones completadas
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
            ) : completedSprints.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20 dark:border-slate-700">
                <PackageCheck className="mb-3 h-10 w-10 text-gray-300 dark:text-slate-600" />
                <p className="font-medium text-gray-500 dark:text-slate-400">Sin iteraciones completadas</p>
                <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
                  Completa una iteración para ver el incremento aquí
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedSprints.map((sprint) => (
                  <div key={sprint.id} className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm dark:border-emerald-900/30 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/60 px-5 py-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="font-semibold text-gray-900 dark:text-white">{sprint.name}</span>
                        </div>
                        {sprint.goal && (
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{sprint.goal}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-500 dark:text-slate-400">
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {sprint.completedPoints}/{sprint.totalPoints}pt
                        </div>
                        <div>{format(new Date(sprint.endDate), "d MMM yyyy", { locale: es })}</div>
                      </div>
                    </div>
                    <div className="px-5 py-3">
                      {sprint.taskCount === 0 ? (
                        <p className="text-xs text-gray-400">Sin tareas</p>
                      ) : (
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300">
                          <BarChart3 className="h-4 w-4 text-emerald-400" />
                          <span>{sprint.taskCount} tareas · {sprint.totalPoints} puntos de historia</span>
                        </div>
                      )}
                    </div>
                    {/* Completed tasks list */}
                    {(sprint.tasks ?? []).length > 0 && (
                      <div className="space-y-1.5 border-t border-gray-100 px-5 pb-4 pt-3 dark:border-slate-800">
                        {(sprint.tasks ?? []).map((task) => (
                          <TaskRow key={task.id} task={task} showCheckbox={false} showDelete={false} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Planificación ──────────────────────────────────────────── */}
        {tab === "backlog" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px]">
            {/* ── LEFT: Product Backlog ─────────────────────────────────── */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-gray-900 dark:text-white">Bolsa de Tareas</h2>
                  {backlog.length > 0 && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                      {backlog.length}
                    </span>
                  )}
                </div>
                <Button size="sm" onClick={() => setTaskModalOpen(true)} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Nueva tarea
                </Button>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-11 rounded-lg" />)}
                </div>
              ) : backlog.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 dark:border-slate-700">
                  <ListTodo className="mb-3 h-8 w-8 text-gray-300 dark:text-slate-600" />
                  <p className="font-medium text-gray-500 dark:text-slate-400">El backlog está vacío</p>
                  <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
                    Crea tareas aquí para planificarlas en iteraciones
                  </p>
                  <Button size="sm" className="mt-4 gap-1.5" onClick={() => setTaskModalOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Crear primera tarea
                  </Button>
                </div>
              ) : (
                <>
                  {/* Bulk selection bar */}
                  {selectedTaskIds.size > 0 && (
                    <div className="mb-3 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 dark:border-indigo-800 dark:bg-indigo-950/50">
                      <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        {selectedTaskIds.size} seleccionada(s)
                      </span>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" className="h-7 gap-1 bg-indigo-600 text-xs text-white hover:bg-indigo-700">
                              <Plus className="h-3 w-3" />
                              Añadir a iteración
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            {plannedAndActive.length === 0 ? (
                              <p className="px-3 py-2 text-xs text-gray-500">No hay iteraciones disponibles</p>
                            ) : (
                              plannedAndActive.map((s) => (
                                <DropdownMenuItem key={s.id} onSelect={() => handleAddToSprint(s.id)}>
                                  <div>
                                    <p className="font-medium">{s.name}</p>
                                    <p className="text-xs text-gray-400 capitalize">{SPRINT_CONFIG[s.status].label}</p>
                                  </div>
                                </DropdownMenuItem>
                              ))
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-indigo-400 hover:text-indigo-600"
                          onClick={clearSelection}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedTaskIds.size === 0 && backlog.length > 1 && (
                    <button
                      onClick={selectAll}
                      className="mb-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400"
                    >
                      <Square className="h-3 w-3" />
                      Seleccionar todo
                    </button>
                  )}

                  <div className="space-y-1.5">
                    {backlog.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        selected={selectedTaskIds.has(task.id)}
                        onToggle={() => toggleTask(task.id)}
                        onDelete={() => deleteTask(task.id, { onSuccess: () => toast.success("Tarea eliminada") })}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>

            {/* ── RIGHT: Sprints ────────────────────────────────────────── */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 dark:text-white">Iteraciones</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setEditSprint(null); sprintForm.reset(); setSprintModalOpen(true) }}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nueva iteración
                </Button>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
              ) : sprints.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 dark:border-slate-700">
                  <Target className="mb-3 h-8 w-8 text-gray-300 dark:text-slate-600" />
                  <p className="font-medium text-gray-500 dark:text-slate-400">Sin iteraciones</p>
                  <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">
                    Crea una iteración para organizar las tareas
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 gap-1.5"
                    onClick={() => { setEditSprint(null); sprintForm.reset(); setSprintModalOpen(true) }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Crear iteración
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...sprints]
                    .sort((a, b) => {
                      const order = { ACTIVE: 0, PLANNED: 1, COMPLETED: 2 }
                      return order[a.status] - order[b.status]
                    })
                    .map((sprint) => (
                      <SprintCard
                        key={sprint.id}
                        sprint={sprint}
                        onStart={() => handleStartSprint(sprint.id)}
                        onComplete={() => setConfirmComplete(sprint)}
                        onDelete={() => setConfirmDeleteSprint(sprint)}
                        onEdit={() => openEditSprint(sprint)}
                        onRemoveTask={(taskId) => handleRemoveFromSprint(sprint.id, taskId)}
                        startPending={false}
                        completePending={false}
                      />
                    ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* ── CreateTaskDialog (reusable) ────────────────────────────────────── */}
      <CreateTaskDialog
        projectId={projectId}
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        members={members}
      />

      {/* ── Modal: Crear / editar sprint ──────────────────────────────────── */}
      <Dialog
        open={sprintModalOpen}
        onOpenChange={(open) => { setSprintModalOpen(open); if (!open) { setEditSprint(null); sprintForm.reset() } }}
      >
        <DialogContent className="bg-white dark:bg-slate-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editSprint ? "Editar iteración" : "Nueva iteración"}</DialogTitle>
            <DialogDescription>Define el nombre, meta y fechas de la iteración.</DialogDescription>
          </DialogHeader>
          <Form {...sprintForm}>
            <form onSubmit={sprintForm.handleSubmit(handleCreateSprint)} className="space-y-4">
              <FormField
                control={sprintForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl><Input placeholder="Ej: Sprint 1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={sprintForm.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta del sprint</FormLabel>
                    <FormControl><Input placeholder="Ej: Implementar autenticación" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={sprintForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inicio *</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={sprintForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fin *</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setSprintModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={creatingSprint}>
                  {creatingSprint ? "Guardando..." : editSprint ? "Guardar cambios" : "Crear iteración"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Confirm: Completar sprint ─────────────────────────────────────── */}
      <AlertDialog open={Boolean(confirmComplete)} onOpenChange={(open) => !open && setConfirmComplete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Completar iteración
            </AlertDialogTitle>
            <AlertDialogDescription>
              Las tareas que <strong>no estén en la columna Done</strong> volverán al Product Backlog.
              Las tareas completadas quedan registradas en el Incremento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleConfirmComplete}
            >
              Completar iteración
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Confirm: Eliminar sprint ──────────────────────────────────────── */}
      <AlertDialog open={Boolean(confirmDeleteSprint)} onOpenChange={(open) => !open && setConfirmDeleteSprint(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar iteración</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{confirmDeleteSprint?.name}&quot;. Las tareas asignadas volverán al backlog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={handleConfirmDeleteSprint}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
