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
    let active = true

    // Named handlers so we can remove exactly these on cleanup
    // without affecting other hooks that share the singleton socket.
    const onConnect = () => { if (active) setConnected(true) }
    const onDisconnect = () => { if (active) setConnected(false) }

    const onNewMessage = (message: ChatMessage) => {
      if (!active) return
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
    }

    const onMessageUpdated = (message: ChatMessage) => {
      if (!active) return
      upsertMessage(queryClient, message.chatId, message)
    }

    const onReactionUpdated = ({
      messageId,
      reactions,
    }: {
      messageId: string
      reactions: MessageReaction[]
    }) => {
      if (!active) return
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

    const onRead = ({
      chatId,
      userId,
      lastReadAt,
    }: {
      chatId: string
      userId: string
      lastReadAt: string
    }) => {
      if (!active) return
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

    const onTyping = ({
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
      if (!active) return
      if (userId === userRef.current) return
      setTypingByChat((prev) => {
        const current = prev[chatId] ?? []
        const next = isTyping
          ? [...current.filter((u) => u.userId !== userId), { userId, name }]
          : current.filter((u) => u.userId !== userId)
        return { ...prev, [chatId]: next }
      })
    }

    const updatePresence = (userId: string, isOnline: boolean) => {
      if (!active) return
      queryClient.setQueryData<ChatSummary[]>(chatKeys.all, (prev) =>
        prev?.map((c) => ({
          ...c,
          participants: c.participants.map((p) =>
            p.userId === userId ? { ...p, isOnline } : p
          ),
        }))
      )
    }

    const onPresence = ({ userId, isOnline }: { userId: string; isOnline: boolean }) =>
      updatePresence(userId, isOnline)

    const onPresenceSync = ({ online }: { online: string[] }) => {
      if (!active) return
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
    }

    connectRealtimeSocket()
      .then((socket) => {
        if (!active) return
        socketRef.current = socket

        socket.on("connect", onConnect)
        socket.on("disconnect", onDisconnect)
        socket.on("chat:new-message", onNewMessage)
        socket.on("chat:message-updated", onMessageUpdated)
        socket.on("chat:reaction-updated", onReactionUpdated)
        socket.on("chat:read", onRead)
        socket.on("chat:typing", onTyping)
        socket.on("chat:presence", onPresence)
        socket.on("chat:presence-sync", onPresenceSync)

        if (socket.connected) setConnected(true)
      })
      .catch(() => {
        if (active) setConnected(false)
      })

    return () => {
      active = false
      const socket = socketRef.current
      if (socket) {
        // Remove only our handlers — don't disconnect the shared socket
        socket.off("connect", onConnect)
        socket.off("disconnect", onDisconnect)
        socket.off("chat:new-message", onNewMessage)
        socket.off("chat:message-updated", onMessageUpdated)
        socket.off("chat:reaction-updated", onReactionUpdated)
        socket.off("chat:read", onRead)
        socket.off("chat:typing", onTyping)
        socket.off("chat:presence", onPresence)
        socket.off("chat:presence-sync", onPresenceSync)
      }
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
