import { apiClient } from "@/lib/api-client"
import type { Task } from "@/features/tasks/tasks.types"
import type {
  AcceptSuggestionDto,
  TaskSuggestion,
  UpdateSuggestionDto,
} from "./suggestions.types"

export const suggestionsApi = {
  listByMinute: (minuteId: string) =>
    apiClient.get<TaskSuggestion[]>(`/minutes/${minuteId}/suggestions`),
  update: (id: string, dto: UpdateSuggestionDto) =>
    apiClient.patch<TaskSuggestion>(`/suggestions/${id}`, dto),
  reject: (id: string) =>
    apiClient.patch<TaskSuggestion>(`/suggestions/${id}/reject`, {}),
  accept: (id: string, dto: AcceptSuggestionDto = {}) =>
    apiClient.patch<{ task: Task; suggestion: TaskSuggestion }>(
      `/suggestions/${id}/accept`,
      dto
    ),
}
