export type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE"
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH"

export interface Task {
  id: string
  title: string
  description?: string | null
  dueDate?: string | null
  priority: TaskPriority
  status: TaskStatus
  projectId: string
  createdById: string
  responsibleId?: string | null
  createdAt: string
  updatedAt: string
  createdBy?: { id: string; name: string; email: string }
  responsible?: { id: string; name: string; email: string }
  project?: { id: string; name: string }
}

export interface CreateTaskDto {
  title: string
  description?: string
  dueDate?: string
  priority?: TaskPriority
  responsibleId?: string
}

export interface UpdateTaskDto {
  title?: string
  description?: string
  dueDate?: string | null
  priority?: TaskPriority
  responsibleId?: string | null
}
