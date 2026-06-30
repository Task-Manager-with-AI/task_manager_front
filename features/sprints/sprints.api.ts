import { apiClient } from "@/lib/api-client"
import type { Sprint, SprintWithTasks, CreateSprintDto, UpdateSprintDto, AssignTasksDto } from "./sprints.types"

export const sprintsApi = {
  listByProject: (projectId: string) =>
    apiClient.get<Sprint[]>(`/projects/${projectId}/sprints`),

  getActive: (projectId: string) =>
    apiClient.get<Sprint | null>(`/projects/${projectId}/sprints/active`),

  get: (sprintId: string) =>
    apiClient.get<SprintWithTasks>(`/sprints/${sprintId}`),

  create: (projectId: string, dto: CreateSprintDto) =>
    apiClient.post<Sprint>(`/projects/${projectId}/sprints`, dto),

  update: (sprintId: string, dto: UpdateSprintDto) =>
    apiClient.patch<Sprint>(`/sprints/${sprintId}`, dto),

  start: (sprintId: string) =>
    apiClient.post<Sprint>(`/sprints/${sprintId}/start`, {}),

  complete: (sprintId: string) =>
    apiClient.post<Sprint>(`/sprints/${sprintId}/complete`, {}),

  delete: (sprintId: string) =>
    apiClient.delete<null>(`/sprints/${sprintId}`),

  assignTasks: (sprintId: string, dto: AssignTasksDto) =>
    apiClient.patch<{ updated: number }>(`/sprints/${sprintId}/tasks`, dto),
}
