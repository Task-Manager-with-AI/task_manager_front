import { apiClient } from "@/lib/api-client"
import type {
  AdminMetrics,
  AdminUsersPage,
  AdminFeedbackPage,
  AdminFeedbackStats,
  AdminUser,
} from "./admin.types"

export const adminApi = {
  metrics: () => apiClient.get<AdminMetrics>("/admin/metrics"),

  users: (params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    isActive?: string
    sortBy?: string
    order?: string
  }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set("page", String(params.page))
    if (params?.limit) q.set("limit", String(params.limit))
    if (params?.search) q.set("search", params.search)
    if (params?.role) q.set("role", params.role)
    if (params?.isActive !== undefined) q.set("isActive", params.isActive)
    if (params?.sortBy) q.set("sortBy", params.sortBy)
    if (params?.order) q.set("order", params.order)
    return apiClient.get<AdminUsersPage>(`/admin/users?${q.toString()}`)
  },

  patchUser: (id: string, data: { isActive?: boolean; roleId?: number }) =>
    apiClient.patch<AdminUser>(`/admin/users/${id}`, data),

  feedback: (params?: {
    page?: number
    limit?: number
    rating?: number
    from?: string
    to?: string
  }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set("page", String(params.page))
    if (params?.limit) q.set("limit", String(params.limit))
    if (params?.rating) q.set("rating", String(params.rating))
    if (params?.from) q.set("from", params.from)
    if (params?.to) q.set("to", params.to)
    return apiClient.get<AdminFeedbackPage>(`/admin/feedback?${q.toString()}`)
  },

  feedbackStats: () => apiClient.get<AdminFeedbackStats>("/admin/feedback/stats"),

  roles: () => apiClient.get<Array<{ id: number; name: string }>>("/admin/roles"),
}
