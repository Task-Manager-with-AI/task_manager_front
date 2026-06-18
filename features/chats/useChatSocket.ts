"use client"

import { useEffect, useRef, useState } from "react"
import type { Socket } from "socket.io-client"
import { useQueryClient } from "@tanstack/react-query"
import { connectRealtimeSocket } from "@/lib/realtime-socket"
import { chatKeys, upsertMessage } from "./chats.hooks"
import type {
  ChatMessage,
  ChatSummary,
  MessageReaction,
} from "./chats.types"

interface TypingUser {
  userId: string
  name: string
}

interface UseChatSocketOptions {
  activeChatId: string | null
  currentUserId: string | null
}

export function useChatSocket({
  activeChatId,
  currentUserId,
}: UseChatSocketOptions) {
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [typingByChat, setTypingByChat] = useState<Record<string, TypingUser[]>>(
    {}
  )
  const activeChatRef = useRef<string | null>(activeChatId)
  activeChatRef.current = activeChatId
  const userRef = useRef<string | null>(currentUserId)
  userRef.current = currentUserId

  useEffect(() => {
    let socket: Socket | null = null
    let cancelled = false

    void (async () => {
      try {
        socket = await connectRealtimeSocket()
        if (cancelled) {
          socket.disconnect()
          return
        }

        socketRef.current = socket

        socket.on("connect", () => setConnected(true))
        socket.on("disconnect", () => setConnected(false))

        socket.on("chat:new-message", (message: ChatMessage) => {
          upsertMessage(queryClient, message.chatId, message)
          queryClient.setQueryData<ChatSummary[]>(chatKeys.all, (prev) =>
            prev?.map((c) => {
              if (c.id !== message.chatId) return c
              const isMine = message.senderId === userRef.current
              const isOpen = activeChatRef.current === message.chatId
              return {
                ...c,
                lastMessage: {
                  id: message.id,
                  senderId: message.senderId,
                  type: message.type,
                  preview:
                    message.type === "IMAGE"
                      ? "📷 Imagen"
                      : message.type === "FILE"
                        ? "📎 Archivo"
                        : message.content,
                  createdAt: message.createdAt,
                },
                unreadCount:
                  isMine || isOpen ? c.unreadCount : c.unreadCount + 1,
              }
            })
          )
        })

        socket.on("chat:message-updated", (message: ChatMessage) => {
          upsertMessage(queryClient, message.chatId, message)
        })

        socket.on(
          "chat:reaction-updated",
          ({
            messageId,
            reactions,
          }: {
            messageId: string
            reactions: MessageReaction[]
          }) => {
            const chatId = activeChatRef.current
            if (!chatId) return
            queryClient.setQueryData<ChatMessage[]>(
              chatKeys.messages(chatId),
              (prev) =>
                prev?.map((m) =>
                  m.id === messageId ? { ...m, reactions } : m
                )
            )
          }
        )

        socket.on(
          "chat:read",
          ({
            chatId,
            userId,
            lastReadAt,
          }: {
            chatId: string
            userId: string
            lastReadAt: string
          }) => {
            if (userId === userRef.current) return
            const readTime = new Date(lastReadAt).getTime()
            queryClient.setQueryData<ChatMessage[]>(
              chatKeys.messages(chatId),
              (prev) =>
                prev?.map((m) =>
                  m.senderId === userRef.current &&
                  new Date(m.createdAt).getTime() <= readTime
                    ? { ...m, status: "read" }
                    : m
                )
            )
          }
        )

        socket.on(
          "chat:typing",
          ({
            chatId,
            userId,
            name,
            isTyping,
          }: {
            chatId: string
            userId: string
            name: string
            isTyping: boolean
          }) => {
            if (userId === userRef.current) return
            setTypingByChat((prev) => {
              const current = prev[chatId] ?? []
              const next = isTyping
                ? [...current.filter((u) => u.userId !== userId), { userId, name }]
                : current.filter((u) => u.userId !== userId)
              return { ...prev, [chatId]: next }
            })
          }
        )

        const updatePresence = (userId: string, isOnline: boolean) => {
          queryClient.setQueryData<ChatSummary[]>(chatKeys.all, (prev) =>
            prev?.map((c) => ({
              ...c,
              participants: c.participants.map((p) =>
                p.userId === userId ? { ...p, isOnline } : p
              ),
            }))
          )
        }

        socket.on(
          "chat:presence",
          ({ userId, isOnline }: { userId: string; isOnline: boolean }) =>
            updatePresence(userId, isOnline)
        )
        socket.on("chat:presence-sync", ({ online }: { online: string[] }) => {
          const set = new Set(online)
          queryClient.setQueryData<ChatSummary[]>(chatKeys.all, (prev) =>
            prev?.map((c) => ({
              ...c,
              participants: c.participants.map((p) => ({
                ...p,
                isOnline: set.has(p.userId),
              })),
            }))
          )
        })
      } catch {
        setConnected(false)
      }
    })()

    return () => {
      cancelled = true
      socket?.disconnect()
      socketRef.current = null
      setConnected(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !activeChatId) return
    socket.emit("chat:join", { chatId: activeChatId })
    return () => {
      socket.emit("chat:leave", { chatId: activeChatId })
      setTypingByChat((prev) => ({ ...prev, [activeChatId]: [] }))
    }
  }, [activeChatId, connected])

  const sendTyping = (chatId: string, isTyping: boolean) => {
    socketRef.current?.emit("chat:typing", { chatId, isTyping })
  }

  const typingUsers = activeChatId ? typingByChat[activeChatId] ?? [] : []

  return { connected, typingUsers, sendTyping }
}
