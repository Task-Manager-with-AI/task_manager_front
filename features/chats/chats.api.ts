import { apiClient, ApiError } from "@/lib/api-client"
import type {
  ChatSummary,
  ChatDetail,
  ChatMessage,
  MessagesPage,
  SendMessageDto,
  MessageReaction,
  ConvertToTaskResult,
  ChatSummaryResult,
} from "./chats.types"

const BASE = "/api/v1"

async function uploadAttachment(chatId: string, file: File): Promise<ChatMessage> {
  const form = new FormData()
  form.append("file", file, file.name)

  const res = await fetch(`${BASE}/chats/${chatId}/attachments`, {
    method: "POST",
    credentials: "include",
    body: form,
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(res.status, body.message ?? "Upload failed", body.errors)
  }
  return body.data as ChatMessage
}

export const chatsApi = {
  list: () => apiClient.get<ChatSummary[]>("/chats"),
  get: (chatId: string) => apiClient.get<ChatDetail>(`/chats/${chatId}`),
  messages: (chatId: string, cursor?: string, limit = 30) =>
    apiClient.get<MessagesPage>(
      `/chats/${chatId}/messages?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`
    ),
  send: (chatId: string, dto: SendMessageDto) =>
    apiClient.post<ChatMessage>(`/chats/${chatId}/messages`, dto),
  edit: (messageId: string, content: string) =>
    apiClient.patch<ChatMessage>(`/chats/messages/${messageId}`, { content }),
  remove: (messageId: string) =>
    apiClient.delete<ChatMessage>(`/chats/messages/${messageId}`),
  toggleReaction: (messageId: string, emoji: string) =>
    apiClient.post<MessageReaction[]>(`/chats/messages/${messageId}/reactions`, {
      emoji,
    }),
  markRead: (chatId: string) =>
    apiClient.patch<{ chatId: string; lastReadAt: string }>(
      `/chats/${chatId}/read`,
      {}
    ),
  direct: (userId: string) =>
    apiClient.post<ChatDetail>("/chats/direct", { userId }),
  convertToTask: (messageId: string, title?: string, responsibleId?: string) =>
    apiClient.post<ConvertToTaskResult>(
      `/chats/messages/${messageId}/convert-to-task`,
      { title, responsibleId }
    ),
  summary: (chatId: string) =>
    apiClient.post<ChatSummaryResult>(`/chats/${chatId}/summary`, {}),
  uploadAttachment,
}
