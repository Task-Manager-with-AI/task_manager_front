"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useTranslation } from "@/components/locale-provider"
import { Check, CheckCheck, MoreVertical, Reply, Smile, ListPlus } from "lucide-react"
import type { ChatMessage } from "./chats.types"

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "👀", "🙏"]

function initials(name: string | null) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface MessageBubbleProps {
  message: ChatMessage
  currentUserId: string | null
  isGroup: boolean
  canConvertToTask: boolean
  onReply: (message: ChatMessage) => void
  onReact: (messageId: string, emoji: string) => void
  onConvertToTask: (message: ChatMessage) => void
  onDelete: (messageId: string) => void
}

export function MessageBubble({
  message,
  currentUserId,
  isGroup,
  canConvertToTask,
  onReply,
  onReact,
  onConvertToTask,
  onDelete,
}: MessageBubbleProps) {
  const { t } = useTranslation()

  if (message.type === "SYSTEM") {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {message.content}
        </span>
      </div>
    )
  }

  const isMine = message.senderId === currentUserId

  const statusIcon = () => {
    if (!isMine) return null
    if (message.status === "read")
      return <CheckCheck className="h-3 w-3 text-blue-500" />
    if (message.status === "delivered")
      return <CheckCheck className="h-3 w-3 text-gray-400" />
    return <Check className="h-3 w-3 text-gray-400" />
  }

  return (
    <div className={`group flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-xs items-end gap-2 lg:max-w-md">
        {!isMine && (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-gray-200 text-xs text-gray-900 dark:bg-gray-600 dark:text-white">
              {initials(message.senderName)}
            </AvatarFallback>
          </Avatar>
        )}
        <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
          {!isMine && isGroup && (
            <span className="mb-1 px-3 text-xs text-gray-500 dark:text-gray-400">
              {message.senderName}
            </span>
          )}

          {message.taskId && (
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              📋 {t("chat.taskCreated")}
            </span>
          )}

          <div className="flex items-center gap-1">
            {isMine && <MessageActions />}
            <div
              className={`rounded-2xl px-4 py-2 ${
                isMine
                  ? "bg-blue-500 text-white"
                  : "border border-gray-200 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              }`}
            >
              {message.replyTo && (
                <div
                  className={`mb-1 border-l-2 pl-2 text-xs ${
                    isMine
                      ? "border-blue-200 text-blue-100"
                      : "border-gray-300 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <span className="font-medium">
                    {message.replyTo.senderName ?? ""}
                  </span>
                  <p className="truncate">{message.replyTo.preview}</p>
                </div>
              )}

              {message.deleted ? (
                <p className="text-sm italic opacity-70">
                  {t("chat.messageDeleted")}
                </p>
              ) : message.type === "IMAGE" && message.attachmentUrl ? (
                <img
                  src={message.attachmentUrl}
                  alt="attachment"
                  className="max-w-full rounded-lg"
                />
              ) : message.type === "FILE" && message.attachmentUrl ? (
                <a
                  href={message.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                >
                  📎 {t("chat.downloadFile")}
                </a>
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm">
                  {message.content}
                </p>
              )}
            </div>
            {!isMine && <MessageActions />}
          </div>

          {message.reactions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {message.reactions.map((r) => (
                <button
                  key={r.emoji}
                  onClick={() => onReact(message.id, r.emoji)}
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    currentUserId && r.userIds.includes(currentUserId)
                      ? "bg-blue-100 dark:bg-blue-900/40"
                      : "bg-gray-100 dark:bg-gray-700"
                  }`}
                >
                  {r.emoji} {r.userIds.length}
                </button>
              ))}
            </div>
          )}

          <div
            className={`mt-1 flex items-center gap-1 ${
              isMine ? "flex-row-reverse" : ""
            }`}
          >
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(message.createdAt)}
            </span>
            {message.editedAt && !message.deleted && (
              <span className="text-xs text-gray-400">({t("chat.edited")})</span>
            )}
            {statusIcon()}
          </div>
        </div>
      </div>
    </div>
  )

  function MessageActions() {
    if (message.deleted) return null
    return (
      <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Smile className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1" align="center">
            <div className="flex gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onReact(message.id, emoji)}
                  className="rounded p-1 text-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isMine ? "end" : "start"}>
            <DropdownMenuItem onClick={() => onReply(message)}>
              <Reply className="mr-2 h-4 w-4" />
              {t("chat.reply")}
            </DropdownMenuItem>
            {canConvertToTask && (
              <DropdownMenuItem onClick={() => onConvertToTask(message)}>
                <ListPlus className="mr-2 h-4 w-4" />
                {t("chat.convertToTask")}
              </DropdownMenuItem>
            )}
            {isMine && (
              <DropdownMenuItem
                onClick={() => onDelete(message.id)}
                className="text-red-600"
              >
                {t("chat.delete")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }
}
