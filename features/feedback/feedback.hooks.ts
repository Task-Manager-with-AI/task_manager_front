"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { feedbackApi } from "./feedback.api"
import type { FeedbackPayload } from "./feedback.types"

export function useMutateFeedback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: FeedbackPayload) => feedbackApi.submit(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback", "my"] }),
  })
}

export function useMyFeedback() {
  return useQuery({
    queryKey: ["feedback", "my"],
    queryFn: feedbackApi.my,
  })
}
