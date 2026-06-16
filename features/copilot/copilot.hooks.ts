"use client"

import { useCallback, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { copilotApi } from "./copilot.api"
import type { Citation, CopilotMessage } from "./copilot.types"

export const copilotKeys = {
  threads: (projectId: string) => ["copilot", "threads", projectId] as const,
  thread: (threadId: string) => ["copilot", "thread", threadId] as const,
  indexStatus: (projectId: string) => ["copilot", "index-status", projectId] as const,
}

export function useCopilotThreads(projectId: string) {
  return useQuery({
    queryKey: copilotKeys.threads(projectId),
    queryFn: () => copilotApi.listThreads(projectId),
    enabled: Boolean(projectId),
  })
}

export function useCopilotThread(threadId: string | null) {
  return useQuery({
    queryKey: copilotKeys.thread(threadId ?? ""),
    queryFn: () => copilotApi.getThread(threadId as string),
    enabled: Boolean(threadId),
  })
}

export function useDeleteCopilotThread(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (threadId: string) => copilotApi.deleteThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: copilotKeys.threads(projectId) })
    },
  })
}

export function useReindexCopilot(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => copilotApi.reindex(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: copilotKeys.indexStatus(projectId) })
    },
  })
}

export function useCopilotIndexStatus(projectId: string) {
  return useQuery({
    queryKey: copilotKeys.indexStatus(projectId),
    queryFn: () => copilotApi.indexStatus(projectId),
    enabled: Boolean(projectId),
  })
}

export interface TranscriptMessage extends Pick<CopilotMessage, "role" | "content"> {
  citations?: Citation[]
  pending?: boolean
}

/**
 * Streaming chat controller for one conversation thread. Manages the local
 * transcript, the live status line, and the SSE lifecycle.
 */
export function useCopilotChat(projectId: string) {
  const queryClient = useQueryClient()
  const [threadId, setThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<TranscriptMessage[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback((newThreadId: string | null) => {
    abortRef.current?.abort()
    setThreadId(newThreadId)
    setMessages([])
    setStatus(null)
    setError(null)
    setIsStreaming(false)
  }, [])

  const loadThread = useCallback(
    (id: string, loaded: TranscriptMessage[]) => {
      abortRef.current?.abort()
      setThreadId(id)
      setMessages(loaded)
      setStatus(null)
      setError(null)
      setIsStreaming(false)
    },
    []
  )

  const send = useCallback(
    async (question: string) => {
      if (!question.trim() || isStreaming) return
      setError(null)
      setIsStreaming(true)
      setStatus("Pensando…")
      setMessages((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: "", pending: true },
      ])

      const controller = new AbortController()
      abortRef.current = controller

      try {
        await copilotApi.ask(
          projectId,
          { question, threadId: threadId ?? undefined },
          (event) => {
            switch (event.type) {
              case "thread":
                setThreadId(event.threadId)
                break
              case "status":
                setStatus(event.message)
                break
              case "message":
                setMessages((prev) => {
                  const next = [...prev]
                  next[next.length - 1] = {
                    role: "assistant",
                    content: event.content,
                    citations: event.citations,
                  }
                  return next
                })
                break
              case "error":
                setError(event.message)
                break
              case "done":
                break
            }
          },
          controller.signal
        )
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message)
        }
      } finally {
        setIsStreaming(false)
        setStatus(null)
        // Refresh the thread list (titles / ordering / new thread).
        queryClient.invalidateQueries({ queryKey: copilotKeys.threads(projectId) })
        setMessages((prev) =>
          prev.map((m) => (m.pending ? { ...m, pending: false } : m))
        )
      }
    },
    [projectId, threadId, isStreaming, queryClient]
  )

  return { threadId, messages, status, isStreaming, error, send, reset, loadThread }
}
