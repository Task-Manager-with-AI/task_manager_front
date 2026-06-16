"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"
import { cn } from "@/lib/utils"

/**
 * Renders LLM markdown answers as readable rich text (headings, bold, lists,
 * code, tables, links) instead of raw `##`/`**`. Styled to sit nicely inside
 * the assistant chat bubble in both light and dark mode.
 */
const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-2 mt-1 text-base font-bold text-gray-900 dark:text-white">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1.5 mt-3 text-[15px] font-bold text-gray-900 dark:text-white">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-2.5 text-sm font-semibold text-gray-900 dark:text-gray-100">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 ml-5 list-disc space-y-1 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-5 list-decimal space-y-1 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-violet-600 underline underline-offset-2 hover:text-violet-700 dark:text-violet-400"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-")
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-md bg-gray-100 p-3 font-mono text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          {children}
        </code>
      )
    }
    return (
      <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.85em] text-violet-700 dark:bg-gray-900 dark:text-violet-300">
        {children}
      </code>
    )
  },
  pre: ({ children }) => <pre className="mb-2 last:mb-0">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-violet-300 pl-3 italic text-gray-600 dark:border-violet-700 dark:text-gray-400">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-gray-200 dark:border-gray-700" />,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-gray-200 bg-gray-50 px-2 py-1 text-left font-semibold dark:border-gray-700 dark:bg-gray-800">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-200 px-2 py-1 dark:border-gray-700">{children}</td>
  ),
}

export function MarkdownContent({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("text-sm text-gray-800 dark:text-gray-100", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
