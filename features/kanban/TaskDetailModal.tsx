"use client"

import { format } from "date-fns"
import { Calendar, Clock, Mail } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Task } from "@/features/tasks/tasks.types"
import type { KanbanColumn } from "./kanban.types"
import { getColumnStyles } from "./kanban.types"
import { useTranslation } from "@/components/locale-provider"

const PRIORITY_STYLES: Record<string, { labelKey: string; cls: string; dot: string }> = {
  LOW: {
    labelKey: "tasks.priorityLow",
    cls: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    dot: "bg-slate-400",
  },
  MEDIUM: {
    labelKey: "tasks.priorityMedium",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  HIGH: {
    labelKey: "tasks.priorityHigh",
    cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    dot: "bg-rose-500",
  },
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
]

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

interface TaskDetailModalProps {
  task: Task | null
  open: boolean
  onClose: () => void
  column?: KanbanColumn
}

function PersonRow({
  person,
  role,
}: {
  person: { id: string; name: string; email: string }
  role: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback
          className={cn("text-[10px] font-bold text-white", avatarColor(person.name))}
        >
          {getInitials(person.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
          {person.name}
        </p>
        <p className="flex items-center gap-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
          <Mail className="h-2.5 w-2.5 shrink-0" />
          {person.email}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-300">
        {role}
      </span>
    </div>
  )
}

export function TaskDetailModal({ task, open, onClose, column }: TaskDetailModalProps) {
  const { t } = useTranslation()
  if (!task) return null

  const priority = PRIORITY_STYLES[task.priority]
  const colStyles = column ? getColumnStyles(column.color) : null

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md gap-0 overflow-hidden border border-slate-200 bg-white p-0 dark:border-slate-700 dark:bg-slate-900">
        {column && colStyles && (
          <div className={cn("h-1 w-full", colStyles.dot)} />
        )}

        <div className="space-y-4 px-5 pb-4 pt-5">
          <DialogHeader className="space-y-2 text-left">
            {column && colStyles && (
              <div
                className={cn(
                  "inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  colStyles.badge
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", colStyles.dot)} />
                {column.title}
              </div>
            )}
            <DialogTitle className="pr-6 text-base font-bold leading-snug text-slate-900 dark:text-white">
              {task.title}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold",
                priority.cls
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", priority.dot)} />
              {t(priority.labelKey)}
            </span>
          </div>

          {task.description ? (
            <section className="space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {t("projects.description")}
              </p>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {task.description}
              </p>
            </section>
          ) : (
            <p className="text-xs italic text-slate-400 dark:text-slate-500">
              {t("kanban.noDescription")}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            {task.dueDate && (
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {t("tasks.dueDate")}
                </p>
                <div className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                  <Calendar className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                  {format(new Date(task.dueDate), "MMM d, yyyy")}
                </div>
              </div>
            )}
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {t("kanban.created")}
              </p>
              <div className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                <Clock className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                {format(new Date(task.createdAt), "MMM d, yyyy")}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-700" />

          <section className="space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {t("kanban.people")}
            </p>
            <div className="space-y-1.5">
              {task.responsible && (
                <PersonRow person={task.responsible} role={t("kanban.owner")} />
              )}
              {task.createdBy && (
                <PersonRow person={task.createdBy} role={t("kanban.creator")} />
              )}
              {!task.responsible && !task.createdBy && (
                <p className="text-xs italic text-slate-400 dark:text-slate-500">
                  {t("kanban.noAssignees")}
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-2 dark:border-slate-700 dark:bg-slate-900/60">
          <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
            ID: {task.id.slice(0, 8)}…
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
