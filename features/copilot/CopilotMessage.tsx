"use client"

import Link from "next/link"
import { Sparkles, User, FileText, Video, MessageSquare, CheckSquare, FileSearch } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Citation } from "./copilot.types"
import type { TranscriptMessage } from "./copilot.hooks"
import { MarkdownContent } from "./MarkdownContent"

const SOURCE_ICON: Record<string, React.FC<{ className?: string }>> = {
  DOCUMENT: FileText,
  MINUTE: FileSearch,
  MEETING_TRANSCRIPT: Video,
  AGREEMENT: CheckSquare,
  TASK: CheckSquare,
  CHAT_MESSAGE: MessageSquare,
}

function CitationChip({ citation }: { citation: Citation }) {
  const Icon = SOURCE_ICON[citation.sourceType] ?? FileText
  const inner = (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600 transition hover:border-violet-300 hover:text-violet-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-violet-600">
      <Icon className="h-3 w-3 shrink-0" />
      <span className="max-w-[200px] truncate">{citation.title}</span>
    </span>
  )
  return citation.url ? (
    <Link href={citation.url} className="no-underline">
      {inner}
    </Link>
  ) : (
    inner
  )
}

export function CopilotMessage({ message }: { message: TranscriptMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      <div className={cn("max-w-[80%] space-y-2", isUser ? "items-end text-right" : "")}>
        <div
          className={cn(
            "inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "whitespace-pre-wrap bg-blue-600 text-white"
              : "bg-white text-left text-gray-800 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700"
          )}
        >
          {isUser ? (
            message.content
          ) : message.content ? (
            <MarkdownContent content={message.content} />
          ) : message.pending ? (
            "…"
          ) : (
            ""
          )}
        </div>

        {message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.citations.map((c, i) => (
              <CitationChip key={`${c.sourceId}-${i}`} citation={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
