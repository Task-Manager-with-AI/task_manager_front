import { apiClient, ApiError } from "@/lib/api-client"
import type { AutoKanbanUpdate, CreateMeetingDto, DailyAnalysis, Meeting, Minute } from "./meetings.types"

const BASE = "/api/v1"

async function uploadAudio(meetingId: string, blob: Blob): Promise<Meeting> {
  const form = new FormData()
  form.append("audio", blob, `meeting-${meetingId}.webm`)

  const res = await fetch(`${BASE}/meetings/${meetingId}/audio`, {
    method: "POST",
    credentials: "include",
    body: form,
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(res.status, body.message ?? "Audio upload failed", body.errors)
  }
  return body.data as Meeting
}

async function uploadMedia(meetingId: string, file: File): Promise<Meeting> {
  const form = new FormData()
  form.append("audio", file, file.name)

  const res = await fetch(`${BASE}/meetings/${meetingId}/audio`, {
    method: "POST",
    credentials: "include",
    body: form,
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(res.status, body.message ?? "Upload failed", body.errors)
  }
  return body.data as Meeting
}

export const meetingsApi = {
  uploadMedia,
  listAll: () => apiClient.get<Meeting[]>(`/meetings`),
  listByProject: (projectId: string) =>
    apiClient.get<Meeting[]>(`/projects/${projectId}/meetings`),
  get: (meetingId: string) => apiClient.get<Meeting>(`/meetings/${meetingId}`),
  create: (projectId: string, dto: CreateMeetingDto) =>
    apiClient.post<Meeting>(`/projects/${projectId}/meetings`, dto),
  start: (meetingId: string) =>
    apiClient.patch<Meeting>(`/meetings/${meetingId}/start`, {}),
  end: (meetingId: string) =>
    apiClient.patch<Meeting>(`/meetings/${meetingId}/end`, {}),
  uploadAudio,
  getMinute: (meetingId: string) =>
    apiClient.get<Minute>(`/meetings/${meetingId}/minutes`),
  getDailyAnalysis: (meetingId: string) =>
    apiClient.get<DailyAnalysis>(`/meetings/${meetingId}/daily`),
  getKanbanUpdates: (meetingId: string) =>
    apiClient.get<AutoKanbanUpdate[]>(`/meetings/${meetingId}/kanban-updates`),
}
