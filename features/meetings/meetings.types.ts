import type { TaskPriority } from "@/features/tasks/tasks.types"

export type MeetingStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "ENDED"
  | "PROCESSED"
  | "FAILED"

export type SuggestionStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EDITED"

export interface MeetingParticipant {
  id: string
  meetingId: string
  userId: string
  joinedAt?: string | null
  leftAt?: string | null
  user: { id: string; name: string; email: string }
}

export interface Meeting {
  id: string
  title: string
  description?: string | null
  projectId: string
  createdById: string
  status: MeetingStatus
  scheduledAt?: string | null
  startedAt?: string | null
  endedAt?: string | null
  audioUrl?: string | null
  errorMessage?: string | null
  createdAt: string
  updatedAt: string
  createdBy: { id: string; name: string; email: string }
  participants: MeetingParticipant[]
  project: { id: string; name: string }
  minute?: { id: string; summary: string } | null
}

export interface Agreement {
  id: string
  minuteId: string
  text: string
  order: number
}

export interface TaskSuggestion {
  id: string
  minuteId: string
  title: string
  description?: string | null
  priority: TaskPriority
  suggestedForId?: string | null
  status: SuggestionStatus
  taskId?: string | null
  createdAt: string
  updatedAt: string
  suggestedFor?: { id: string; name: string; email: string } | null
  task?: { id: string; title: string; status: string } | null
  minute?: {
    id: string
    meetingId: string
    meeting: { id: string; title: string; projectId: string }
  }
}

export interface Minute {
  id: string
  meetingId: string
  transcript: string
  summary: string
  keyPoints: string[]
  language: string
  createdAt: string
  updatedAt: string
  meeting: {
    id: string
    title: string
    projectId: string
    startedAt?: string | null
    endedAt?: string | null
  }
  agreements: Agreement[]
  taskSuggestions: TaskSuggestion[]
}

export interface CreateMeetingDto {
  title: string
  description?: string
  scheduledAt?: string
  participantIds?: string[]
}
