"use client"

import { ChevronRight } from "lucide-react"
import type { DocumentOutlineHeading } from "@/features/documents/documents.types"

type OutlineSidebarProps = {
  headings: DocumentOutlineHeading[]
  onHeadingClick?: (pos: number) => void
}

export function OutlineSidebar({ headings, onHeadingClick }: OutlineSidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50 shrink-0 overflow-y-auto select-none">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Esquema
      </h3>
      <div className="space-y-1">
        {headings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-white/70 px-3 py-3 text-xs italic text-gray-400 dark:border-gray-800 dark:bg-gray-950/40 dark:text-gray-500">
            Sin estructura de titulos.
            <br />
            Usa H1, H2 o H3 en el editor.
          </div>
        ) : (
          headings.map((heading, index) => {
            const levelClasses =
              heading.level === 1
                ? "text-sm font-semibold text-gray-700 dark:text-gray-200"
                : heading.level === 2
                  ? "ml-3.5 border-l border-gray-200 pl-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300"
                  : "ml-7 border-l border-gray-200 pl-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400"

            return (
              <div
                key={`${heading.pos}-${index}`}
                onClick={() => onHeadingClick?.(heading.pos)}
                className={`flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-800 ${levelClasses}`}
              >
                {heading.level === 1 ? (
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                ) : (
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600" />
                )}
                <span className="min-w-0 truncate">
                  <span className="mr-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">
                    {heading.numbering}
                  </span>
                  <span>{heading.text.trim() || (heading.level === 1 ? "Titulo sin texto" : "Subtitulo sin texto")}</span>
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
