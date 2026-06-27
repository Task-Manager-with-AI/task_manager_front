"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/locale-provider"
import { ArrowLeft, Sparkles, Users } from "lucide-react"
import {
  useChatMessages,
  useDeleteMessage,
  useMarkChatRead,
  useSendMessage,
  useToggleReaction,
  useUploadAttachment,
} from "./chats.hooks"
import { MessageBubble } from "./MessageBubble"
import { MessageComposer } from "./MessageComposer"
import { ConvertToTaskDialog } from "./ConvertToTaskDialog"
import { ChatSummaryDialog } from "./ChatSummaryDialog"
import type { ChatMessage, ChatSummary } from "./chats.types"

interface ChatWindowProps {
  chat: ChatSummary
  currentUserId: string | null
  typingUsers: { userId: string; name: string }[]
  onTyping: (chatId: string, isTyping: boolean) => void
  onBack?: () => void
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function ChatWindow({
  chat,
  currentUserId,
  typingUsers,
  onTyping,
  onBack,
}: ChatWindowProps) {
  const { t } = useTranslation()
  const { data: messages, isLoading } = useChatMessages(chat.id)
  const sendMessage = useSendMessage(chat.id)
  const uploadAttachment = useUploadAttachment(chat.id)
  const toggleReaction = useToggleReaction(chat.id)
  const deleteMessage = useDeleteMessage(chat.id)
  const markRead = useMarkChatRead()

  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [convertTarget, setConvertTarget] = useState<ChatMessage | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const isGroup = chat.type === "PROJECT"
  const isProject = chat.type === "PROJECT"

  const onlineCount = useMemo(
    () => chat.participants.filter((p) => p.isOnline).length,
    [chat.participants]
  )
  const otherParticipant = chat.participants.find(
    (p) => p.userId !== currentUserId
  )

  // Auto-scroll to bottom when messages change.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages?.length])

  // Mark the chat as read when opening or when new messages arrive.
  useEffect(() => {
    if (chat.id && (messages?.length ?? 0) >= 0) {
      markRead.mutate(chat.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.id, messages?.length])

  const statusLine = () => {
    if (typingUsers.length > 0) {
      return isGroup
        ? `${typingUsers.map((u) => u.name).join(", ")} ${t("chat.typing")}`
        : t("chat.typing")
    }
    if (isGroup) {
      return `${chat.participants.length} ${t("chat.members")} · ${onlineCount} ${t("chat.online")}`
    }
    return otherParticipant?.isOnline ? t("chat.online") : t("chat.offline")
  }

  return (
    <div className="flex flex-1 flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              onClick={onBack}
              aria-label="Volver a la lista"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="relative shrink-0">
            {isGroup ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 sm:h-10 sm:w-10">
                <Users className="h-4 w-4 text-white sm:h-5 sm:w-5" />
              </div>
            ) : (
              <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                <AvatarFallback className="bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-white">
                  {initials(chat.name)}
                </AvatarFallback>
              </Avatar>
            )}
            {!isGroup && otherParticipant?.isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-800" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
              {chat.name}
            </h2>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              {statusLine()}
            </p>
          </div>
        </div>
        {isProject && (
          <Button
            variant="outline"
            size="sm"
            className="ml-2 shrink-0"
            onClick={() => setSummaryOpen(true)}
          >
            <Sparkles className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("chat.whatDidIMiss")}</span>
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {isLoading ? (
          <p className="text-center text-sm text-gray-500">
            {t("common.loading")}
          </p>
        ) : (messages?.length ?? 0) === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-500">{t("chat.noMessages")}</p>
          </div>
        ) : (
          messages?.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              isGroup={isGroup}
              canConvertToTask={isProject}
              onReply={setReplyTo}
              onReact={(messageId, emoji) =>
                toggleReaction.mutate({ messageId, emoji })
              }
              onConvertToTask={setConvertTarget}
              onDelete={(messageId) => deleteMessage.mutate(messageId)}
            />
          ))
        )}
      </div>

      {/* Composer */}
      <MessageComposer
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSend={(content, replyToId) => {
          sendMessage.mutate({ content, replyToId })
          setReplyTo(null)
        }}
        onUploadFile={(file) => uploadAttachment.mutate(file)}
        onTyping={(isTyping) => onTyping(chat.id, isTyping)}
        disabled={sendMessage.isPending}
      />

      <ConvertToTaskDialog
        message={convertTarget}
        open={Boolean(convertTarget)}
        onOpenChange={(open) => !open && setConvertTarget(null)}
      />
      <ChatSummaryDialog
        chatId={summaryOpen ? chat.id : null}
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
      />
    </div>
  )
}
