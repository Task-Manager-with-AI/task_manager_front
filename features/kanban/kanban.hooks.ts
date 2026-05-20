"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { kanbanApi } from "./kanban.api"
import type { UpdateKanbanLayoutDto } from "./kanban.types"

export function kanbanColumnsQueryKey(projectId: string) {
  return ["kanban-columns", projectId] as const
}

export function useKanbanColumns(projectId: string) {
  return useQuery({
    queryKey: kanbanColumnsQueryKey(projectId),
    queryFn: () => kanbanApi.listColumns(projectId),
    enabled: Boolean(projectId),
  })
}

export function useUpdateKanbanLayout(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateKanbanLayoutDto) => kanbanApi.updateLayout(projectId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanColumnsQueryKey(projectId) })
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
    },
  })
}
