import { apiClient } from "@/lib/api-client"
import type {
  NotificationPage,
  NotificationPreference,
} from "./notifications.types"

export const notificationsApi = {
  list(params: { cursor?: string; filter?: "all" | "unread" } = {}) {
    const q = new URLSearchParams()
    if (params.cursor) q.set("cursor", params.cursor)
    if (params.filter) q.set("filter", params.filter)
    const qs = q.toString()
    return apiClient.get<NotificationPage>(`/notifications${qs ? `?${qs}` : ""}`)
  },

  unreadCount() {
    return apiClient.get<{ count: number }>("/notifications/unread-count")
  },

  markRead(id: string) {
    return apiClient.patch<{ id: string; unreadCount: number }>(
      `/notifications/${id}/read`
    )
  },

  markAllRead() {
    return apiClient.patch<{ updated: number; unreadCount: number }>(
      "/notifications/read-all"
    )
  },

  remove(id: string) {
    return apiClient.delete<{ deleted: boolean; unreadCount: number }>(
      `/notifications/${id}`
    )
  },

  getPreferences() {
    return apiClient.get<NotificationPreference[]>("/notifications/preferences")
  },

  updatePreferences(preferences: NotificationPreference[]) {
    return apiClient.put<NotificationPreference[]>("/notifications/preferences", {
      preferences,
    })
  },

  getVapidKey() {
    return apiClient.get<{ publicKey: string | null }>(
      "/notifications/push/vapid-public-key"
    )
  },

  subscribePush(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    return apiClient.post<{ subscribed: boolean }>(
      "/notifications/push/subscribe",
      sub
    )
  },

  unsubscribePush(endpoint: string) {
    return apiClient.delete<{ unsubscribed: boolean }>(
      "/notifications/push/subscribe"
    )
  },
}
