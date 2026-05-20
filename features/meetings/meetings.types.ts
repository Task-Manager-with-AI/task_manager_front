import type { TaskPriority } from "@/features/tasks/tasks.types"

export type MeetingStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "ENDED"
  | "PROCESSED"
  | "FAILED"

export type MeetingType = "REGULAR" | "DAILY" | "SPRINT_PLANNING"

export type SprintHealth = "GREEN" | "YELLOW" | "RED"

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
  meetingType: MeetingType
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
  dailyAnalysis?: { id: string; sprintHealth: SprintHealth } | null
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
  task?: { id: string; title: string; column?: { id: string; title: string } } | null
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

export interface DailyEntry {
  id: string
  participantName: string
  yesterday: string
  today: string
  blockers: string[]
}

export interface DailyAnalysis {
  id: string
  meetingId: string
  sprintHealth: SprintHealth
  overallBlockers: string[]
  createdAt: string
  entries: DailyEntry[]
}

export interface AutoKanbanUpdate {
  id: string
  meetingId: string
  taskId?: string | null
  taskTitle: string
  newStatus: "DONE" | "IN_PROGRESS" | "BLOCKED"
  mentionedBy: string
  confidence: number
  notes?: string | null
  applied: boolean
  createdAt: string
}
