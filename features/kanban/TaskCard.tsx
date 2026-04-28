"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { format } from "date-fns"
import { Calendar, GripVertical } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Task } from "@/features/tasks/tasks.types"

const PRIORITY_STYLES = {
  LOW: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

interface TaskCardProps {
  task: Task
  isDragOverlay?: boolean
}

export function TaskCard({ task, isDragOverlay = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="listitem"
      className={cn(
        "bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-600 select-none",
        isDragging && "opacity-40",
        isDragOverlay && "shadow-lg rotate-2 cursor-grabbing"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          {...attributes}
          aria-label={`Drag task ${task.title}`}
          className="mt-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge className={cn("text-xs px-1.5 py-0", PRIORITY_STYLES[task.priority])}>
              {task.priority}
            </Badge>
            {task.dueDate && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                {format(new Date(task.dueDate), "MMM d")}
              </span>
            )}
            {task.responsible && (
              <Avatar className="w-5 h-5 ml-auto">
                <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
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
      </div>
    </div>
  )
}
