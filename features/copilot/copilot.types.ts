export interface Citation {
  chunkId?: string
  sourceType: string
  sourceId: string
  title: string
  url: string | null
}

export interface CopilotThreadSummary {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
  _count: { messages: number }
}

export interface CopilotMessage {
  id: string
  role: "user" | "assistant" | "tool"
  content: string
  citations: Citation[] | null
  createdAt: string
}

export interface CopilotThreadDetail {
  thread: { id: string; projectId: string; userId: string; title: string | null }
  messages: CopilotMessage[]
}

/** Server-Sent-Event payloads streamed from POST /copilot/ask. */
export type CopilotStreamEvent =
  | { type: "thread"; threadId: string }
  | { type: "status"; message: string }
  | { type: "tool"; name: string; args: Record<string, unknown> }
  | { type: "message"; content: string; citations: Citation[] }
  | { type: "error"; message: string }
  | { type: "done" }
