"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTranslation } from "@/components/locale-provider"
import { Search, Users } from "lucide-react"
import type { ChatSummary } from "./chats.types"

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function formatTime(iso: string) {
  const date = new Date(iso)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" })
}

interface ChatListProps {
  chats: ChatSummary[]
  selectedChatId: string | null
  currentUserId: string | null
  isLoading: boolean
  onSelect: (chatId: string) => void
}

export function ChatList({
  chats,
  selectedChatId,
  currentUserId,
  isLoading,
  onSelect,
}: ChatListProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")

  const filtered = chats.filter((chat) =>
    chat.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="flex w-80 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <h1 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          {t("chat.title")}
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t("chat.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="p-4 text-sm text-gray-500">{t("common.loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">{t("chat.noChats")}</p>
        ) : (
          filtered.map((chat) => {
            const isGroup = chat.type === "PROJECT"
            const other = chat.participants.find(
              (p) => p.userId !== currentUserId
            )
            const isOnline = isGroup
              ? chat.participants.some(
                  (p) => p.userId !== currentUserId && p.isOnline
                )
              : Boolean(other?.isOnline)

            return (
              <button
                key={chat.id}
                onClick={() => onSelect(chat.id)}
                className={`w-full border-b border-gray-100 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 ${
                  selectedChatId === chat.id
                    ? "border-r-2 border-r-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    {isGroup ? (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    ) : (
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-white">
                          {initials(chat.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {isOnline && (
                      <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500 dark:border-gray-800" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {chat.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {chat.lastMessage && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(chat.lastMessage.createdAt)}
                          </span>
                        )}
                        {chat.unreadCount > 0 && (
                          <Badge className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-2 text-xs text-white">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-400">
                      {chat.lastMessage?.preview ?? t("chat.noMessagesYet")}
                    </p>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
