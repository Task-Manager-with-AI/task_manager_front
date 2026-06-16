"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { notificationsApi } from "./notifications.api"
import type { NotificationPreference } from "./notifications.types"

export const notificationKeys = {
  list: (filter: string) => ["notifications", "list", filter] as const,
  unread: ["notifications", "unread-count"] as const,
  prefs: ["notifications", "preferences"] as const,
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: () => notificationsApi.unreadCount(),
    refetchOnWindowFocus: true,
  })
}

export function useNotifications(filter: "all" | "unread" = "all") {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(filter),
    queryFn: ({ pageParam }) =>
      notificationsApi.list({ cursor: pageParam as string | undefined, filter }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.prefs,
    queryFn: () => notificationsApi.getPreferences(),
  })
}

export function useUpdatePreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (prefs: NotificationPreference[]) =>
      notificationsApi.updatePreferences(prefs),
    onSuccess: (data) => {
      qc.setQueryData(notificationKeys.prefs, data)
    },
  })
}
