export type ChatType = "PROJECT" | "DIRECT"
export type MessageType = "TEXT" | "IMAGE" | "FILE" | "SYSTEM"
export type MessageStatus = "sent" | "delivered" | "read"

export interface ChatParticipant {
  userId: string
  name: string
  imageUrl?: string
  isOnline: boolean
}

export interface ChatLastMessage {
  id: string
  senderId: string | null
  type: MessageType
  preview: string
  createdAt: string
}

export interface ChatSummary {
  id: string
  type: ChatType
  name: string
  avatarUrl?: string
  projectId?: string
  participants: ChatParticipant[]
  lastMessage?: ChatLastMessage
  unreadCount: number
}

export interface ChatDetail {
  id: string
  type: ChatType
  name: string
  projectId?: string
  participants: ChatParticipant[]
}

export interface MessageReaction {
  emoji: string
  userIds: string[]
}

export interface ChatMessage {
  id: string
  chatId: string
  senderId: string | null
  senderName: string | null
  type: MessageType
  content: string
  deleted: boolean
  attachmentUrl?: string
  attachmentMime?: string
  replyTo?: { id: string; senderName: string | null; preview: string }
  reactions: MessageReaction[]
  taskId?: string
  status: MessageStatus
  createdAt: string
  editedAt?: string
}

export interface MessagesPage {
  items: ChatMessage[]
  nextCursor?: string
}

export interface SendMessageDto {
  content: string
  replyToId?: string
}

export interface ConvertToTaskResult {
  taskId: string
  title: string
}

export interface ChatSummaryResult {
  summary: string[]
  count: number
}
