"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/components/locale-provider"
import { useConvertMessageToTask } from "./chats.hooks"
import type { ChatMessage } from "./chats.types"

interface ConvertToTaskDialogProps {
  message: ChatMessage | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConvertToTaskDialog({
  message,
  open,
  onOpenChange,
}: ConvertToTaskDialogProps) {
  const { t } = useTranslation()
  const convert = useConvertMessageToTask()
  const [title, setTitle] = useState("")

  useEffect(() => {
    if (message) setTitle(message.content.slice(0, 120))
  }, [message])

  const handleConfirm = () => {
    if (!message) return
    convert.mutate(
      { messageId: message.id, title: title.trim() || undefined },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("chat.convertToTask")}</DialogTitle>
          <DialogDescription>{t("chat.convertToTaskHint")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="task-title">{t("chat.taskTitle")}</Label>
          <Input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("chat.taskTitle")}
          />
        </div>
        {convert.isError && (
          <p className="text-sm text-red-600">{t("chat.actionFailed")}</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={convert.isPending}>
            {convert.isPending ? t("common.loading") : t("chat.createTask")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
