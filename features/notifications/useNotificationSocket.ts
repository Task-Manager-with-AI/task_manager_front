"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { Socket } from "socket.io-client"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { connectRealtimeSocket } from "@/lib/realtime-socket"
import { notificationKeys } from "./notifications.hooks"
import type { AppNotification } from "./notifications.types"

/**
 * Subscribes to realtime notification events and keeps the React Query cache
 * fresh. Shows a toast (with a "Ver" action that deep-links) on new ones.
 * Mount once near the app shell.
 */
export function useNotificationSocket() {
  const qc = useQueryClient()
  const router = useRouter()
  const socketRef = useRef<Socket | null>(null)

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

        const refresh = () => {
          qc.invalidateQueries({ queryKey: notificationKeys.unread })
          qc.invalidateQueries({ queryKey: ["notifications", "list"] })
        }

        socket.on("notification:new", (n: AppNotification) => {
          refresh()
          const url = n.data?.url
          toast(n.title, {
            description: n.body ?? undefined,
            action: url
              ? { label: "Ver", onClick: () => router.push(url) }
              : undefined,
          })
        })

        socket.on("notification:unread-count", () => {
          qc.invalidateQueries({ queryKey: notificationKeys.unread })
        })

        socket.on("notification:read", () => refresh())
      } catch {
        // Notifications still work via polling; socket is best-effort.
      }
    })()

    return () => {
      cancelled = true
      socket?.off("notification:new")
      socket?.off("notification:unread-count")
      socket?.off("notification:read")
      socket?.disconnect()
      socketRef.current = null
    }
  }, [qc, router])
}
