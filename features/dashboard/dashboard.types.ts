export interface DashboardKpis {
  activeProjects: number
  openTasks: number
  overdueTasks: number
  meetingsThisWeek: number
}

export interface DashboardProjectCard {
  id: string
  name: string
  status: string
  totalTasks: number
  doneTasks: number
  progressPercent: number
  activeSprint?: { id: string; name: string; endDate: string }
  sprintHealth?: "GREEN" | "YELLOW" | "RED" | null
}

export interface BurndownData {
  sprint: { id: string; name: string; startDate: string; endDate: string }
  unit: "storyPoints" | "tasks"
  ideal: Array<{ date: string; remaining: number }>
  actual: Array<{ date: string; remaining: number }>
}

export interface BurnupData {
  scope: Array<{ date: string; total: number }>
  completed: Array<{ date: string; done: number }>
}

export interface DashboardOverview {
  kpis: DashboardKpis
  projects: DashboardProjectCard[]
  burndown: BurndownData | null
  burnup: BurnupData | null
  tasksByColumn: Array<{ column: string; count: number; color?: string }>
  tasksByPriority: Array<{ priority: string; count: number }>
  weeklyVelocity: Array<{ weekLabel: string; completed: number }>
}

export type CalendarEventType = "TASK_DUE" | "MEETING" | "SPRINT_END"

export interface CalendarEvent {
  id: string
  type: CalendarEventType
  title: string
  date: string
  datetime?: string
  projectId: string
  projectName: string
  meta?: {
    priority?: string
    meetingType?: string
    sprintName?: string
  }
}

export interface DashboardCalendar {
  events: CalendarEvent[]
}
