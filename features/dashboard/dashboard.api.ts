import { apiClient } from "@/lib/api-client"
import type { DashboardCalendar, DashboardOverview } from "./dashboard.types"

export const dashboardApi = {
  overview: (projectId?: string, sprintId?: string) => {
    const search = new URLSearchParams()
    if (projectId) search.set("projectId", projectId)
    if (sprintId) search.set("sprintId", sprintId)
    const query = search.toString()
    return apiClient.get<DashboardOverview>(`/dashboard/overview${query ? `?${query}` : ""}`)
  },
  calendar: (from: string, to: string, projectId?: string) => {
    const search = new URLSearchParams({ from, to })
    if (projectId) search.set("projectId", projectId)
    return apiClient.get<DashboardCalendar>(`/dashboard/calendar?${search}`)
  },
}
