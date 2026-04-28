"use client"

import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { useDroppable } from "@dnd-kit/core"
import { TaskCard } from "./TaskCard"
import { KANBAN_COLUMNS } from "./kanban.types"
import type { Task, TaskStatus } from "@/features/tasks/tasks.types"

interface KanbanColumnProps {
  id: TaskStatus
  title: string
  tasks: Task[]
}

function KanbanColumn({ id, title, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        role="list"
        aria-label={`${title} tasks`}
        className={`flex-1 min-h-48 rounded-xl p-2 space-y-2 transition-colors ${
          isOver
            ? "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-300 dark:ring-blue-700"
            : "bg-gray-50 dark:bg-gray-800/50"
        }`}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 pt-6">
            Drop tasks here
          </p>
        )}
      </div>
    </div>
  )
}

interface KanbanBoardProps {
  tasks: Task[]
  onStatusChange: (taskId: string, status: TaskStatus) => void
}

export function KanbanBoard({ tasks, onStatusChange }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

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
    const targetStatus = over.id as TaskStatus

    if (!KANBAN_COLUMNS.some((c) => c.id === targetStatus)) return

    const task = tasks.find((t) => t.id === taskId)
    if (task && task.status !== targetStatus) {
      onStatusChange(taskId, targetStatus)
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            tasks={tasks.filter((t) => t.status === col.id)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
