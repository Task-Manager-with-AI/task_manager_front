import { apiClient } from "@/lib/api-client"
import type {
  CopilotStreamEvent,
  CopilotThreadDetail,
  CopilotThreadSummary,
} from "./copilot.types"

export const copilotApi = {
  listThreads(projectId: string) {
    return apiClient.get<CopilotThreadSummary[]>(
      `/projects/${projectId}/copilot/threads`
    )
  },

  getThread(threadId: string) {
    return apiClient.get<CopilotThreadDetail>(`/copilot/threads/${threadId}`)
  },

  deleteThread(threadId: string) {
    return apiClient.delete<{ deleted: boolean }>(`/copilot/threads/${threadId}`)
  },

  reindex(projectId: string) {
    return apiClient.post<{ enqueuedJobs: number }>(
      `/projects/${projectId}/copilot/reindex`
    )
  },

  indexStatus(projectId: string) {
    return apiClient.get<{
      totalChunks: number
      byType: { sourceType: string; count: number }[]
      lastIndexedAt: string | null
    }>(`/projects/${projectId}/copilot/index-status`)
  },

  /** Transcribe a recorded voice clip via the backend (Whisper). */
  async transcribe(audio: Blob, fileName = "dictation.webm"): Promise<string> {
    const form = new FormData()
    form.append("audio", audio, fileName)
    const res = await fetch(`/api/v1/copilot/transcribe`, {
      method: "POST",
      credentials: "include",
      body: form,
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body?.message ?? `Transcription failed (${res.status})`)
    }
    return (body?.data?.transcript as string) ?? ""
  },

  /**
   * Ask the copilot. Streams SSE events; `onEvent` is invoked per event until
   * the stream ends. Returns a function to abort the request.
   */
  async ask(
    projectId: string,
    body: { question: string; threadId?: string },
    onEvent: (event: CopilotStreamEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const res = await fetch(`/api/v1/projects/${projectId}/copilot/ask`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    })

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "")
      throw new Error(text || `Copilot request failed (${res.status})`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // SSE frames are separated by a blank line.
      const frames = buffer.split("\n\n")
      buffer = frames.pop() ?? ""

      for (const frame of frames) {
        const line = frame
          .split("\n")
          .find((l) => l.startsWith("data:"))
        if (!line) continue
        const json = line.slice("data:".length).trim()
        if (!json) continue
        try {
          onEvent(JSON.parse(json) as CopilotStreamEvent)
        } catch {
          // Ignore malformed frames.
        }
      }
    }
  },
}
