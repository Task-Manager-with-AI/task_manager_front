"use client"

import { useMemo, useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { Plus } from "lucide-react"
import { TaskCard } from "./TaskCard"
import type { KanbanColumn } from "./kanban.types"
import { getColumnStyles } from "./kanban.types"
import type { Task } from "@/features/tasks/tasks.types"
import { useTranslation } from "@/components/locale-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BoardColumnProps {
  column: KanbanColumn
  tasks: Task[]
  canAddTask: boolean
  onColumnChange: (taskId: string, columnId: string) => void
  onAddTask: (columnId: string) => void
  onTaskClick: (task: Task) => void
  allColumns: KanbanColumn[]
}

function BoardColumn({
  column,
  tasks,
  canAddTask,
  onColumnChange,
  onAddTask,
  onTaskClick,
  allColumns,
}: BoardColumnProps) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const styles = getColumnStyles(column.color)

  return (
    <div className="flex w-[min(100%,280px)] shrink-0 flex-col min-h-0">
      <div
        className={cn(
          "mb-3 flex items-center justify-between gap-2 rounded-lg border border-t-4 bg-white/70 px-3 py-2 backdrop-blur-sm dark:bg-slate-900/60 dark:border-slate-700/50",
          styles.header
        )}
      >
        <h3 className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
          {column.title}
        </h3>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", styles.badge)}>
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        role="list"
        aria-label={t("kanban.columnTasksAria").replace("{title}", column.title)}
        className={cn(
          "flex min-h-52 flex-1 flex-col rounded-xl border border-white/20 p-2 transition-colors dark:border-slate-700/50",
          isOver ? cn("ring-2", styles.drop) : "bg-gray-50/90 dark:bg-slate-800/60"
        )}
      >
        <div className="flex-1 space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columns={allColumns}
              onMoveTo={onColumnChange}
              onClick={() => onTaskClick(task)}
            />
          ))}
          {tasks.length === 0 && (
            <p className="px-2 pt-6 text-center text-xs text-gray-500 dark:text-gray-400">
              {t("kanban.dropTasksHere")}
            </p>
          )}
        </div>
        {canAddTask && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start gap-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            onClick={() => onAddTask(column.id)}
          >
            <Plus className="h-4 w-4" />
            {t("kanban.addTask")}
          </Button>
        )}
      </div>
    </div>
  )
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  tasks: Task[]
  onColumnChange: (taskId: string, columnId: string) => void
  onAddTask: (columnId: string) => void
  onTaskClick: (task: Task) => void
}

export function KanbanBoard({
  columns,
  tasks,
  onColumnChange,
  onAddTask,
  onTaskClick,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const columnIds = new Set(columns.map((c) => c.id))
  const leftmostColumnId = useMemo(() => {
    if (columns.length === 0) return null
    return [...columns].sort((a, b) => a.position - b.position)[0]?.id ?? null
  }, [columns])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const taskId = active.id as string
    const targetColumnId = over.id as string
    if (!columnIds.has(targetColumnId)) return

    const task = tasks.find((t) => t.id === taskId)
    if (task && task.columnId !== targetColumnId) {
      onColumnChange(taskId, targetColumnId)
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            tasks={tasks.filter((task) => task.columnId === column.id)}
            canAddTask={column.id === leftmostColumnId}
            onColumnChange={onColumnChange}
            onAddTask={onAddTask}
            onTaskClick={onTaskClick}
            allColumns={columns}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} columns={columns} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
