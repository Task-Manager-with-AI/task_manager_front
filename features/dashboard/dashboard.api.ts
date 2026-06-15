import { apiClient } from "@/lib/api-client"
import type { DashboardCalendar, DashboardOverview } from "./dashboard.types"

export const dashboardApi = {
  overview: (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : ""
    return apiClient.get<DashboardOverview>(`/dashboard/overview${params}`)
  },
  calendar: (from: string, to: string, projectId?: string) => {
    const search = new URLSearchParams({ from, to })
    if (projectId) search.set("projectId", projectId)
    return apiClient.get<DashboardCalendar>(`/dashboard/calendar?${search}`)
  },
}
