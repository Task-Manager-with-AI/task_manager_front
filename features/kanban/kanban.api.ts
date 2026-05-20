import { apiClient } from "@/lib/api-client"
import type { KanbanColumn, UpdateKanbanLayoutDto } from "./kanban.types"

export const kanbanApi = {
  listColumns: (projectId: string) =>
    apiClient.get<KanbanColumn[]>(`/projects/${projectId}/kanban/columns`),
  updateLayout: (projectId: string, dto: UpdateKanbanLayoutDto) =>
    apiClient.put<KanbanColumn[]>(`/projects/${projectId}/kanban/columns`, dto),
}
