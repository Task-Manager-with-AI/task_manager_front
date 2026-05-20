import type { TaskPriority } from "@/features/tasks/tasks.types"
import type { TaskSuggestion } from "@/features/meetings/meetings.types"

export type { TaskSuggestion }

export interface UpdateSuggestionDto {
  title?: string
  description?: string | null
  priority?: TaskPriority
  suggestedForId?: string | null
}

export interface AcceptSuggestionDto {
  title?: string
  description?: string | null
  priority?: TaskPriority
  responsibleId?: string | null
  dueDate?: string
}
