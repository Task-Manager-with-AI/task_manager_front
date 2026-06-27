export interface FeedbackPayload {
  rating: number
  comment?: string
  page?: string
}

export interface FeedbackItem {
  id: string
  userId: string
  rating: number
  comment?: string
  page?: string
  createdAt: string
}
