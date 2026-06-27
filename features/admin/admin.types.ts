export interface AdminMetrics {
  users: {
    total: number
    active: number
    newLast7Days: number
    newLast30Days: number
    byProvider: { email: number; google: number }
  }
  projects: { total: number; active: number }
  tasks: { total: number; completed: number }
  meetings: { total: number; withMinutes: number }
  documents: { total: number }
  chats: { totalMessages: number; directChats: number }
  feedback: { count: number; averageRating: number }
  registrationsByDay: Array<{ date: string; count: number }>
}

export interface AdminUser {
  id: string
  name: string
  email: string
  isActive: boolean
  emailVerified: boolean
  hasGoogle: boolean
  createdAt: string
  role: { id: number; name: string }
  _count: { memberships: number; tasksOwned: number }
}

export interface AdminUsersPage {
  users: AdminUser[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AdminFeedbackItem {
  id: string
  userId: string
  rating: number
  comment?: string
  page?: string
  createdAt: string
  user: { name: string; email: string }
}

export interface AdminFeedbackPage {
  feedback: AdminFeedbackItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AdminFeedbackStats {
  count: number
  average: number
  distribution: Record<string, number>
  byDay: Array<{ date: string; average: number; count: number }>
}
