"use client"

import { Suspense } from "react"
import { ChatLayout } from "@/features/chats/ChatLayout"

export default function ChatsPage() {
  return (
    <Suspense fallback={null}>
      <ChatLayout />
    </Suspense>
  )
}
