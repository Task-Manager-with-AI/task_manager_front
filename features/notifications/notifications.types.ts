export type NotificationCategory =
  | "PROJECT"
  | "MEETING"
  | "TASK"
  | "DOCUMENT"
  | "CHAT"
  | "AI"
  | "SYSTEM"

export interface AppNotification {
  id: string
  type: string
  category: NotificationCategory
  title: string
  body: string | null
  data: { url?: string; [key: string]: unknown } | null
  count: number
  readAt: string | null
  createdAt: string
  actor?: { id: string; name: string } | null
}

export interface NotificationPage {
  items: AppNotification[]
  nextCursor: string | null
}

export interface NotificationPreference {
  category: NotificationCategory
  inApp: boolean
  push: boolean
  email: boolean
}
