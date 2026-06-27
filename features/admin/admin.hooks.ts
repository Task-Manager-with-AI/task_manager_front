"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "./admin.api"

export function useAdminMetrics() {
  return useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: adminApi.metrics,
    staleTime: 30_000,
  })
}

export function useAdminUsers(params?: Parameters<typeof adminApi.users>[0]) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => adminApi.users(params),
  })
}

export function usePatchAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isActive?: boolean; roleId?: number } }) =>
      adminApi.patchUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  })
}

export function useAdminFeedback(params?: Parameters<typeof adminApi.feedback>[0]) {
  return useQuery({
    queryKey: ["admin", "feedback", params],
    queryFn: () => adminApi.feedback(params),
  })
}

export function useAdminFeedbackStats() {
  return useQuery({
    queryKey: ["admin", "feedback", "stats"],
    queryFn: adminApi.feedbackStats,
    staleTime: 60_000,
  })
}

export function useAdminRoles() {
  return useQuery({
    queryKey: ["admin", "roles"],
    queryFn: adminApi.roles,
    staleTime: Infinity,
  })
}
