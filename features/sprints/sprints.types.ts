import type { Task } from "@/features/tasks/tasks.types"

export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED"

export interface Sprint {
  id: string
  projectId: string
  name: string
  goal?: string | null
  startDate: string
  endDate: string
  status: SprintStatus
  createdAt: string
  updatedAt: string
  taskCount: number
  totalPoints: number
  completedPoints: number
  tasks?: Task[]
}

export interface SprintWithTasks extends Omit<Sprint, "taskCount" | "totalPoints" | "completedPoints"> {
  tasks: Task[]
}

export interface CreateSprintDto {
  name: string
  goal?: string
  startDate: string
  endDate: string
}

export interface UpdateSprintDto {
  name?: string
  goal?: string
  startDate?: string
  endDate?: string
}

export interface AssignTasksDto {
  taskIds: string[]
  action: "add" | "remove"
}
