import type { Task, TaskStatus } from "@/features/tasks/tasks.types"

export interface KanbanColumn {
  id: TaskStatus
  title: string
  tasks: Task[]
}

export const KANBAN_COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "PENDING", title: "Pending" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "DONE", title: "Done" },
]
