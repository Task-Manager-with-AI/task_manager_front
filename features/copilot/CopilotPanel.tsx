"use client"

import { useEffect, useRef, useState } from "react"
import { Sparkles, Plus, Trash2, Loader2, RefreshCw, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  useCopilotChat,
  useCopilotThread,
  useCopilotThreads,
  useDeleteCopilotThread,
  useReindexCopilot,
  type TranscriptMessage,
} from "./copilot.hooks"
import { CopilotMessage } from "./CopilotMessage"
import { CopilotComposer } from "./CopilotComposer"

const SUGGESTIONS = [
  "¿De qué se habló en la última reunión?",
  "¿Qué tareas están bloqueadas?",
  "Resume el chat del equipo de hoy",
  "¿Qué reuniones tengo esta semana?",
]

export function CopilotPanel({ projectId }: { projectId: string }) {
  const chat = useCopilotChat(projectId)
  const { data: threads } = useCopilotThreads(projectId)
  const { mutate: deleteThread } = useDeleteCopilotThread(projectId)
  const { mutate: reindex, isPending: reindexing } = useReindexCopilot(projectId)

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false)
  const { data: threadDetail } = useCopilotThread(selectedThreadId)

  const scrollRef = useRef<HTMLDivElement>(null)

  // When a stored thread is loaded, hydrate the chat transcript.
  useEffect(() => {
    if (threadDetail && selectedThreadId) {
      const loaded: TranscriptMessage[] = threadDetail.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          citations: m.citations ?? undefined,
        }))
      chat.loadThread(selectedThreadId, loaded)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadDetail, selectedThreadId])

  // Autoscroll on new content.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [chat.messages, chat.status])

  const startNew = () => {
    setSelectedThreadId(null)
    chat.reset(null)
  }

  const isEmpty = chat.messages.length === 0

  const ThreadList = ({ onSelect }: { onSelect?: () => void }) => (
    <>
      <div className="p-3">
        <Button
          onClick={() => { startNew(); onSelect?.() }}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" /> Nueva conversación
        </Button>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-3">
          {threads?.map((t) => (
            <div
              key={t.id}
              className={cn(
                "group flex items-center gap-1 rounded-lg px-2 py-2 text-sm transition",
                selectedThreadId === t.id
                  ? "bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <button
                className="min-w-0 flex-1 truncate text-left"
                onClick={() => { setSelectedThreadId(t.id); onSelect?.() }}
                title={t.title ?? "Conversación"}
              >
                {t.title ?? "Conversación"}
              </button>
              <button
                className="shrink-0 opacity-0 transition group-hover:opacity-100"
                aria-label="Eliminar conversación"
                onClick={() => {
                  deleteThread(t.id)
                  if (selectedThreadId === t.id) startNew()
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t border-gray-200 p-2 dark:border-gray-800">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-xs text-gray-500"
          onClick={() => reindex()}
          disabled={reindexing}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", reindexing && "animate-spin")} />
          Reindexar conocimiento
        </Button>
      </div>
    </>
  )

  return (
    <div className="flex h-full">
      {/* History sidebar — desktop only */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/40 md:flex">
        <ThreadList />
      </aside>

      {/* Mobile history drawer */}
      <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
        <SheetContent side="left" className="flex w-72 flex-col p-0">
          <SheetHeader className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <SheetTitle className="text-sm">Historial de conversaciones</SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 flex-col overflow-hidden">
            <ThreadList onSelect={() => setMobileHistoryOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Conversation */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile toolbar */}
        <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-gray-600 dark:text-gray-400"
            onClick={() => setMobileHistoryOpen(true)}
          >
            <History className="h-3.5 w-3.5" />
            Historial
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-gray-600 dark:text-gray-400"
            onClick={startNew}
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva
          </Button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {isEmpty ? (
            <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                <Sparkles className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Pregúntale al proyecto
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Conozco los documentos, reuniones, minutas, tareas y el chat de este proyecto.
              </p>
              <div className="mt-6 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => chat.send(s)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 shadow-sm transition hover:border-violet-300 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5">
              {chat.messages.map((m, i) => (
                <CopilotMessage key={i} message={m} />
              ))}
              {chat.status && (
                <div className="flex items-center gap-2 pl-11 text-sm text-gray-500 dark:text-gray-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {chat.status}
                </div>
              )}
              {chat.error && (
                <div className="mx-auto max-w-3xl rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {chat.error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mx-auto w-full max-w-3xl">
          <CopilotComposer onSend={chat.send} disabled={chat.isStreaming} />
        </div>
      </div>
    </div>
  )
}
