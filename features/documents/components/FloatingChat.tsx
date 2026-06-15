"use client"

import { useState } from "react"
import { MessageCircle, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/components/locale-provider"

type Message = {
  id: string
  userId: string
  userName: string
  text: string
  timestamp: Date
}

type FloatingChatProps = {
  currentUser: { id: string; name: string }
}

export function FloatingChat({ currentUser }: FloatingChatProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      userId: "system",
      userName: "Sistema",
      text: "Bienvenido al chat del documento. Los mensajes aquí son temporales por ahora.",
      timestamp: new Date(),
    }
  ])
  const [inputValue, setInputValue] = useState("")

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      text: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 rounded-xl bg-white shadow-2xl border border-gray-200 dark:border-gray-800 dark:bg-gray-900 z-50 flex flex-col overflow-hidden transition-all">
      {/* Header */}
      <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="font-semibold text-sm">Chat de Equipo</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-white hover:bg-blue-700 hover:text-white"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="h-80 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50 dark:bg-gray-950">
        {messages.map((msg) => {
          const isMe = msg.userId === currentUser.id
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${isMe ? "self-end" : "self-start"}`}
            >
              {!isMe && (
                <span className="text-[10px] text-gray-500 mb-1 ml-1">
                  {msg.userName}
                </span>
              )}
              <div
                className={`rounded-2xl px-3 py-2 text-sm ${
                  isMe
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          )
        })}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
      >
        <Input
          placeholder="Escribe un mensaje..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 h-9 rounded-full bg-gray-100 border-transparent focus-visible:ring-1 focus-visible:ring-blue-500 dark:bg-gray-800"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!inputValue.trim()}
          className="h-9 w-9 rounded-full shrink-0 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4 ml-1" />
        </Button>
      </form>
    </div>
  )
}
