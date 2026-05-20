"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { format } from "date-fns"
import { ArrowRightLeft, Calendar, GripVertical } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { KanbanColumn } from "./kanban.types"
import type { Task } from "@/features/tasks/tasks.types"
import { useTranslation } from "@/components/locale-provider"

const PRIORITY_STYLES = {
  LOW: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

interface TaskCardProps {
  task: Task
  columns?: KanbanColumn[]
  isDragOverlay?: boolean
  onMoveTo?: (taskId: string, columnId: string) => void
  onClick?: () => void
}

export function TaskCard({
  task,
  columns = [],
  isDragOverlay = false,
  onMoveTo,
  onClick,
}: TaskCardProps) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  const moveTargets = columns.filter((col) => col.id !== task.columnId)

  const priorityLabel = {
    LOW: t("tasks.priorityLow"),
    MEDIUM: t("tasks.priorityMedium"),
    HIGH: t("tasks.priorityHigh"),
  }[task.priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="listitem"
      className={cn(
        "rounded-lg border border-gray-200 bg-white p-3 shadow-sm select-none dark:border-gray-600 dark:bg-gray-700",
        isDragging && "opacity-40",
        isDragOverlay && "shadow-lg rotate-2 cursor-grabbing",
        onClick && !isDragOverlay && "cursor-pointer hover:border-blue-300 dark:hover:border-blue-600"
      )}
      onClick={!isDragOverlay ? onClick : undefined}
      onKeyDown={
        onClick && !isDragOverlay
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      tabIndex={onClick && !isDragOverlay ? 0 : undefined}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...listeners}
          {...attributes}
          aria-label={t("kanban.dragTaskAria").replace("{title}", task.title)}
          className="mt-0.5 rounded-sm text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:text-gray-300 dark:hover:text-gray-100 cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className={cn("px-1.5 py-0 text-xs", PRIORITY_STYLES[task.priority])}>
              {priorityLabel}
            </Badge>
            {task.dueDate && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.dueDate), "MMM d")}
              </span>
            )}
            {task.responsible && (
              <Avatar className="ml-auto h-5 w-5">
                <AvatarFallback className="bg-blue-100 text-[10px] text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {task.responsible.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
        {!isDragOverlay && onMoveTo && moveTargets.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                aria-label={t("kanban.moveTaskAria").replace("{title}", task.title)}
                onClick={(e) => e.stopPropagation()}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {moveTargets.map((col) => (
                <DropdownMenuItem key={col.id} onClick={() => onMoveTo(task.id, col.id)}>
                  {t("kanban.moveTo").replace("{column}", col.title)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
