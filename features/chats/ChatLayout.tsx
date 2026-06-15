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

  const currentUserId = currentUser?.id ?? null
  const { typingUsers, sendTyping } = useChatSocket({
    activeChatId: selectedChatId,
    currentUserId,
  })

  // Deep-link support: /chats?chatId=<id> (e.g. from People → Message).
  useEffect(() => {
    const fromUrl = searchParams.get("chatId")
    if (fromUrl) setSelectedChatId(fromUrl)
  }, [searchParams])

  // Default to the first chat once loaded.
  useEffect(() => {
    if (!selectedChatId && chats && chats.length > 0) {
      setSelectedChatId(chats[0].id)
    }
  }, [chats, selectedChatId])

  const selectedChat = chats?.find((c) => c.id === selectedChatId) ?? null

  return (
    <div className="flex h-[calc(100vh-120px)]">
      <ChatList
        chats={chats ?? []}
        selectedChatId={selectedChatId}
        currentUserId={currentUserId}
        isLoading={isLoading}
        onSelect={setSelectedChatId}
      />

      {selectedChat ? (
        <ChatWindow
          key={selectedChat.id}
          chat={selectedChat}
          currentUserId={currentUserId}
          typingUsers={typingUsers}
          onTyping={sendTyping}
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
  )
}
