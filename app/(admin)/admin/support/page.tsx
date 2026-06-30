"use client"

import { Suspense } from "react"
import { ChatLayout } from "@/features/chats/ChatLayout"
import { MessageSquare } from "lucide-react"

export default function AdminSupportPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="border-b border-border px-4 py-3 sm:px-6 sm:py-4 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-amber-500" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Chats de soporte
          </h1>
        </div>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          Todos tus chats directos con usuarios de la plataforma
        </p>
      </div>

      {/* Chat interface */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Suspense fallback={null}>
          <ChatLayout />
        </Suspense>
      </div>
    </div>
  )
}
