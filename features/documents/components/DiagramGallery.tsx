"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { Network } from "lucide-react"
import type { GeneratedDiagram } from "../documents.types"
import { DiagramViewerModal } from "./DiagramViewerModal"

type DiagramGalleryProps = {
  diagrams: GeneratedDiagram[]
  title: string
  emptyMessage: string
  className?: string
}

export function DiagramGallery({
  diagrams,
  title,
  emptyMessage,
  className,
}: DiagramGalleryProps) {
  const [selectedDiagram, setSelectedDiagram] = useState<GeneratedDiagram | null>(null)

  const groups = useMemo(() => {
    const grouped = new Map<string, GeneratedDiagram[]>()

    for (const diagram of diagrams) {
      const key = diagram.diagramType
      const current = grouped.get(key) ?? []
      current.push(diagram)
      grouped.set(key, current)
    }

    return Array.from(grouped.entries())
  }, [diagrams])

  return (
    <>
      <section className={className}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Organizados por tipo de diagrama.
          </p>
        </div>

        {diagrams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(([diagramType, items]) => (
              <div key={diagramType} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-200">
                    {humanizeDiagramType(diagramType)} ({items.length})
                  </h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((diagram) => (
                    <button
                      key={diagram.id}
                      type="button"
                      onClick={() => setSelectedDiagram(diagram)}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-950">
                        <img
                          src={diagram.url}
                          alt={diagram.title}
                          className="h-full w-full object-cover object-top"
                          loading="lazy"
                        />
                      </div>
                      <div className="space-y-2 p-4">
                        <div className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {diagram.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {format(new Date(diagram.createdAt), "dd MMM yyyy HH:mm")}
                        </div>
                        {diagram.document?.title && (
                          <div className="text-xs text-slate-600 dark:text-slate-300">
                            Documento: {diagram.document.title}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <DiagramViewerModal diagram={selectedDiagram} onClose={() => setSelectedDiagram(null)} />
    </>
  )
}

function humanizeDiagramType(diagramType: string) {
  if (diagramType === "use_case") return "Casos de uso"
  if (diagramType === "sequence") return "Secuencia"
  if (diagramType === "activity") return "Actividad"
  if (diagramType === "component") return "Componentes"
  if (diagramType === "deployment") return "Deployment"
  if (diagramType === "class") return "Clases"
  return diagramType
}
