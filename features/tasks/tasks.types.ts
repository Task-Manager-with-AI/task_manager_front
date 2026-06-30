export type TaskPriority = "LOW" | "MEDIUM" | "HIGH"

export interface TaskColumn {
  id: string
  title: string
  color?: string | null
  position?: number
}

export interface Task {
  id: string
  title: string
  description?: string | null
  dueDate?: string | null
  priority: TaskPriority
  columnId?: string | null
  sprintId?: string | null
  storyPoints: number
  completedAt?: string | null
  projectId: string
  createdById: string
  responsibleId?: string | null
  createdAt: string
  updatedAt: string
  createdBy?: { id: string; name: string; email: string }
  responsible?: { id: string; name: string; email: string }
  project?: { id: string; name: string }
  column?: TaskColumn | null
}

export interface CreateTaskDto {
  title: string
  description?: string
  dueDate?: string
  priority?: TaskPriority
  responsibleId?: string
  columnId?: string
  sprintId?: string
  storyPoints?: number
}

export interface UpdateTaskDto {
  title?: string
  description?: string
  dueDate?: string | null
  priority?: TaskPriority
  responsibleId?: string | null
  sprintId?: string | null
  storyPoints?: number
}
