"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  CheckCheck,
  FolderOpen,
  Video,
  CheckSquare,
  FileText,
  MessageSquare,
  Sparkles,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  useDeleteNotification,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from "./notifications.hooks"
import { useNotificationSocket } from "./useNotificationSocket"
import type { AppNotification, NotificationCategory } from "./notifications.types"

const CATEGORY_ICON: Record<NotificationCategory, React.FC<{ className?: string }>> = {
  PROJECT: FolderOpen,
  MEETING: Video,
  TASK: CheckSquare,
  DOCUMENT: FileText,
  CHAT: MessageSquare,
  AI: Sparkles,
  SYSTEM: Bell,
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "ahora"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return `hace ${d} d`
}

export function NotificationBell() {
  useNotificationSocket()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const { data: unread } = useUnreadCount()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotifications("all")
  const { mutate: markRead } = useMarkRead()
  const { mutate: markAllRead } = useMarkAllRead()
  const { mutate: remove } = useDeleteNotification()

  const items = useMemo<AppNotification[]>(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  )
  const count = unread?.count ?? 0

  const handleClick = (n: AppNotification) => {
    if (!n.readAt) markRead(n.id)
    const url = n.data?.url
    if (url) {
      setOpen(false)
      router.push(url)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notificaciones" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5 dark:border-gray-800">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Notificaciones
          </span>
          {count > 0 && (
            <button
              onClick={() => markAllRead()}
              className="flex items-center gap-1 text-xs text-violet-600 hover:underline dark:text-violet-400"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todo leído
            </button>
          )}
        </div>

        <ScrollArea className="max-h-[420px]">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              No tienes notificaciones.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((n) => {
                const Icon = CATEGORY_ICON[n.category] ?? Bell
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "group flex cursor-pointer gap-3 px-4 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-800/60",
                      !n.readAt && "bg-violet-50/60 dark:bg-violet-950/20"
                    )}
                    onClick={() => handleClick(n)}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {n.title}
                          {n.count > 1 && (
                            <span className="ml-1 text-xs text-gray-500">×{n.count}</span>
                          )}
                        </p>
                        {!n.readAt && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-600" />
                        )}
                      </div>
                      {n.body && (
                        <p className="line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {relativeTime(n.createdAt)}
                      </p>
                    </div>
                    <button
                      className="opacity-0 transition group-hover:opacity-100"
                      aria-label="Eliminar"
                      onClick={(e) => {
                        e.stopPropagation()
                        remove(n.id)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full py-2.5 text-center text-xs text-violet-600 hover:underline dark:text-violet-400"
            >
              {isFetchingNextPage ? "Cargando…" : "Ver más"}
            </button>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
