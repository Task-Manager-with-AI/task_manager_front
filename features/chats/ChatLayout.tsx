"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Users } from "lucide-react"
import { useTranslation } from "@/components/locale-provider"
import { useCurrentUser } from "@/features/auth/auth.hooks"
import { useChats } from "./chats.hooks"
import { useChatSocket } from "./useChatSocket"
import { ChatList } from "./ChatList"
import { ChatWindow } from "./ChatWindow"

export function ChatLayout() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const { data: currentUser } = useCurrentUser()
  const { data: chats, isLoading } = useChats()

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<"list" | "chat">("list")

  const currentUserId = currentUser?.id ?? null
  const { typingUsers, sendTyping } = useChatSocket({
    activeChatId: selectedChatId,
    currentUserId,
  })

  // Deep-link support: /chats?chatId=<id> (e.g. from People → Message).
  useEffect(() => {
    const fromUrl = searchParams.get("chatId")
    if (fromUrl) {
      setSelectedChatId(fromUrl)
      setMobileView("chat")
    }
  }, [searchParams])

  // Default to the first chat once loaded (desktop only — on mobile keep list view).
  useEffect(() => {
    if (!selectedChatId && chats && chats.length > 0) {
      setSelectedChatId(chats[0].id)
    }
  }, [chats, selectedChatId])

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId)
    setMobileView("chat")
  }

  const handleBackToList = () => {
    setMobileView("list")
  }

  const selectedChat = chats?.find((c) => c.id === selectedChatId) ?? null

  return (
    <div className="flex h-full">
      {/* Sidebar: full-width on mobile (toggled), fixed width on md+ */}
      <div
        className={[
          "flex h-full flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
          "w-full shrink-0 md:w-80",
          mobileView === "chat" ? "hidden md:flex" : "flex",
        ].join(" ")}
      >
        <ChatList
          chats={chats ?? []}
          selectedChatId={selectedChatId}
          currentUserId={currentUserId}
          isLoading={isLoading}
          onSelect={handleSelectChat}
        />
      </div>

      {/* Chat panel: hidden on mobile when list is shown */}
      <div
        className={[
          "flex min-h-0 flex-1 flex-col",
          mobileView === "list" ? "hidden md:flex" : "flex",
        ].join(" ")}
      >
        {selectedChat ? (
          <ChatWindow
            key={selectedChat.id}
            chat={selectedChat}
            currentUserId={currentUserId}
            typingUsers={typingUsers}
            onTyping={sendTyping}
            onBack={handleBackToList}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                {t("chat.selectConversation")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t("chat.selectConversationHint")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
