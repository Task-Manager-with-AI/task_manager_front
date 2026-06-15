"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/components/locale-provider"
import { Paperclip, Send, X } from "lucide-react"
import type { ChatMessage } from "./chats.types"

interface MessageComposerProps {
  replyTo: ChatMessage | null
  onCancelReply: () => void
  onSend: (content: string, replyToId?: string) => void
  onUploadFile: (file: File) => void
  onTyping: (isTyping: boolean) => void
  disabled?: boolean
}

export function MessageComposer({
  replyTo,
  onCancelReply,
  onSend,
  onUploadFile,
  onTyping,
  disabled,
}: MessageComposerProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (next: string) => {
    setValue(next)
    onTyping(true)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => onTyping(false), 1500)
  }

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed, replyTo?.id)
    setValue("")
    onTyping(false)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-700">
          <div className="min-w-0">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {t("chat.replyingTo")} {replyTo.senderName ?? ""}
            </p>
            <p className="truncate text-sm text-gray-600 dark:text-gray-300">
              {replyTo.type === "IMAGE"
                ? "📷 Imagen"
                : replyTo.type === "FILE"
                  ? "📎 Archivo"
                  : replyTo.content}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancelReply}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.txt"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onUploadFile(file)
            e.target.value = ""
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          placeholder={t("chat.typeMessage")}
          value={value}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          className="flex-1 bg-gray-100 dark:bg-gray-700"
        />
        <Button onClick={handleSend} disabled={disabled || !value.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
