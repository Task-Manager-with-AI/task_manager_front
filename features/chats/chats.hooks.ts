"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { chatsApi } from "./chats.api"
import type { ChatMessage, ChatSummary, SendMessageDto } from "./chats.types"

export const chatKeys = {
  all: ["chats"] as const,
  messages: (chatId: string) => ["chats", chatId, "messages"] as const,
}

export function useChats() {
  return useQuery({
    queryKey: chatKeys.all,
    queryFn: chatsApi.list,
  })
}

export function useChatMessages(chatId: string) {
  return useQuery({
    queryKey: chatKeys.messages(chatId),
    queryFn: async () => {
      const page = await chatsApi.messages(chatId)
      return page.items
    },
    enabled: Boolean(chatId),
  })
}

export function useSendMessage(chatId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: SendMessageDto) => chatsApi.send(chatId, dto),
    onSuccess: (message) => {
      upsertMessage(queryClient, chatId, message)
      queryClient.invalidateQueries({ queryKey: chatKeys.all })
    },
  })
}

export function useUploadAttachment(chatId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => chatsApi.uploadAttachment(chatId, file),
    onSuccess: (message) => {
      upsertMessage(queryClient, chatId, message)
      queryClient.invalidateQueries({ queryKey: chatKeys.all })
    },
  })
}

export function useEditMessage(chatId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      chatsApi.edit(messageId, content),
    onSuccess: (message) => upsertMessage(queryClient, chatId, message),
  })
}

export function useDeleteMessage(chatId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (messageId: string) => chatsApi.remove(messageId),
    onSuccess: (message) => upsertMessage(queryClient, chatId, message),
  })
}

export function useToggleReaction(chatId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      chatsApi.toggleReaction(messageId, emoji),
    onSuccess: (reactions, { messageId }) => {
      queryClient.setQueryData<ChatMessage[]>(
        chatKeys.messages(chatId),
        (prev) =>
          prev?.map((m) => (m.id === messageId ? { ...m, reactions } : m))
      )
    },
  })
}

export function useMarkChatRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (chatId: string) => chatsApi.markRead(chatId),
    onSuccess: ({ chatId }) => {
      queryClient.setQueryData<ChatSummary[]>(chatKeys.all, (prev) =>
        prev?.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c))
      )
    },
  })
}

export function useGetOrCreateDirectChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => chatsApi.direct(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all })
    },
  })
}

export function useConvertMessageToTask() {
  return useMutation({
    mutationFn: ({
      messageId,
      title,
      responsibleId,
    }: {
      messageId: string
      title?: string
      responsibleId?: string
    }) => chatsApi.convertToTask(messageId, title, responsibleId),
  })
}

export function useChatSummary(chatId: string) {
  return useMutation({
    mutationFn: () => chatsApi.summary(chatId),
  })
}

/** Inserts or replaces a message in the cached message list, keeping order. */
export function upsertMessage(
  queryClient: ReturnType<typeof useQueryClient>,
  chatId: string,
  message: ChatMessage
) {
  queryClient.setQueryData<ChatMessage[]>(chatKeys.messages(chatId), (prev) => {
    if (!prev) return [message]
    const idx = prev.findIndex((m) => m.id === message.id)
    if (idx >= 0) {
      const copy = [...prev]
      copy[idx] = message
      return copy
    }
    return [...prev, message]
  })
}
