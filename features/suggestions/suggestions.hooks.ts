"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { suggestionsApi } from "./suggestions.api"
import type {
  AcceptSuggestionDto,
  UpdateSuggestionDto,
} from "./suggestions.types"

export function useMinuteSuggestions(minuteId: string) {
  return useQuery({
    queryKey: ["suggestions", minuteId],
    queryFn: () => suggestionsApi.listByMinute(minuteId),
    enabled: Boolean(minuteId),
  })
}

export function useUpdateSuggestion(minuteId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSuggestionDto }) =>
      suggestionsApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions", minuteId] })
    },
  })
}

export function useRejectSuggestion(minuteId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => suggestionsApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions", minuteId] })
    },
  })
}

export function useAcceptSuggestion(minuteId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto?: AcceptSuggestionDto }) =>
      suggestionsApi.accept(id, dto ?? {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions", minuteId] })
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
    },
  })
}
