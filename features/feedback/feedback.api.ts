import { apiClient } from "@/lib/api-client"
import type { FeedbackPayload, FeedbackItem } from "./feedback.types"

export const feedbackApi = {
  submit: (payload: FeedbackPayload) =>
    apiClient.post<FeedbackItem>("/feedback", payload),

  my: () => apiClient.get<FeedbackItem[]>("/feedback/my"),
}
