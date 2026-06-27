"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { Socket } from "socket.io-client"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { connectRealtimeSocket } from "@/lib/realtime-socket"
import { notificationKeys } from "./notifications.hooks"
import type { AppNotification } from "./notifications.types"

export function useNotificationSocket() {
  const qc = useQueryClient()
  const router = useRouter()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    let active = true

    const refresh = () => {
      if (!active) return
      qc.invalidateQueries({ queryKey: notificationKeys.unread })
      qc.invalidateQueries({ queryKey: ["notifications", "list"] })
    }

    const onNew = (n: AppNotification) => {
      if (!active) return
      refresh()
      const url = n.data?.url
      toast(n.title, {
        description: n.body ?? undefined,
        action: url
          ? { label: "Ver", onClick: () => router.push(url) }
          : undefined,
      })
    }

    const onUnreadCount = () => {
      if (active) qc.invalidateQueries({ queryKey: notificationKeys.unread })
    }

    const onRead = () => refresh()

    connectRealtimeSocket()
      .then((socket) => {
        if (!active) return
        socketRef.current = socket
        socket.on("notification:new", onNew)
        socket.on("notification:unread-count", onUnreadCount)
        socket.on("notification:read", onRead)
      })
      .catch(() => {
        // Notifications still work via polling; socket is best-effort.
      })

    return () => {
      active = false
      const socket = socketRef.current
      if (socket) {
        socket.off("notification:new", onNew)
        socket.off("notification:unread-count", onUnreadCount)
        socket.off("notification:read", onRead)
      }
      socketRef.current = null
    }
  }, [qc, router])
}
