"use client"

import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "./dashboard.api"

export function useDashboardOverview(projectId?: string, sprintId?: string) {
  return useQuery({
    queryKey: ["dashboard", "overview", projectId ?? "all", sprintId ?? "none"],
    queryFn: () => dashboardApi.overview(projectId, sprintId),
    staleTime: 60_000,
  })
}

export function useDashboardCalendar(from: string, to: string, projectId?: string) {
  return useQuery({
    queryKey: ["dashboard", "calendar", from, to, projectId ?? "all"],
    queryFn: () => dashboardApi.calendar(from, to, projectId),
    staleTime: 60_000,
    enabled: Boolean(from && to),
  })
}
