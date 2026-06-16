"use client"

import { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "@/components/locale-provider"
import { Sparkles } from "lucide-react"
import { useChatSummary } from "./chats.hooks"

interface ChatSummaryDialogProps {
  chatId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChatSummaryDialog({
  chatId,
  open,
  onOpenChange,
}: ChatSummaryDialogProps) {
  const { t } = useTranslation()
  const summary = useChatSummary(chatId ?? "")
  const { mutate, reset } = summary

  useEffect(() => {
    if (open && chatId) {
      mutate()
    } else {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, chatId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            {t("chat.summaryTitle")}
          </DialogTitle>
          <DialogDescription>{t("chat.summaryHint")}</DialogDescription>
        </DialogHeader>
        <div className="min-h-[80px]">
          {summary.isPending && (
            <p className="text-sm text-gray-500">{t("chat.summaryLoading")}</p>
          )}
          {summary.isError && (
            <p className="text-sm text-red-600">{t("chat.actionFailed")}</p>
          )}
          {summary.isSuccess && summary.data.summary.length === 0 && (
            <p className="text-sm text-gray-500">{t("chat.summaryEmpty")}</p>
          )}
          {summary.isSuccess && summary.data.summary.length > 0 && (
            <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700 dark:text-gray-200">
              {summary.data.summary.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
