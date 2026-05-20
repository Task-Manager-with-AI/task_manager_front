import { apiClient } from "@/lib/api-client"
import type { Task, CreateTaskDto, UpdateTaskDto } from "./tasks.types"

export const tasksApi = {
  listByProject: (projectId: string) =>
    apiClient.get<Task[]>(`/projects/${projectId}/tasks`),
  get: (id: string) => apiClient.get<Task>(`/tasks/${id}`),
  create: (projectId: string, dto: CreateTaskDto) =>
    apiClient.post<Task>(`/projects/${projectId}/tasks`, dto),
  update: (id: string, dto: UpdateTaskDto) =>
    apiClient.patch<Task>(`/tasks/${id}`, dto),
  updateColumn: (id: string, columnId: string) =>
    apiClient.patch<Task>(`/tasks/${id}/column`, { columnId }),
  delete: (id: string) => apiClient.delete<null>(`/tasks/${id}`),
}
