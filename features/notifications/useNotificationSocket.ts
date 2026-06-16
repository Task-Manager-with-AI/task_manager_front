"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { io, Socket } from "socket.io-client"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { notificationKeys } from "./notifications.hooks"
import type { AppNotification } from "./notifications.types"

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(
  /\/api\/v1\/?$/,
  ""
)

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
    const opts = {
      path: "/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
    }
    const socket = SOCKET_URL ? io(SOCKET_URL, opts) : io(opts)
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

    return () => {
      socket.off("notification:new")
      socket.off("notification:unread-count")
      socket.off("notification:read")
      socket.disconnect()
    }
  }, [qc, router])
}
