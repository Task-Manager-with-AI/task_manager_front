"use client"

import type { GeneratedDiagram } from "../documents.types"
import { ImageViewerModal } from "./ImageViewerModal"

type DiagramViewerModalProps = {
  diagram: GeneratedDiagram | null
  onClose: () => void
}

export function DiagramViewerModal({ diagram, onClose }: DiagramViewerModalProps) {
  return (
    <ImageViewerModal
      isOpen={Boolean(diagram)}
      src={diagram?.url ?? null}
      alt={diagram?.title}
      title={diagram?.title ?? "Diagrama"}
      subtitle={diagram ? diagram.diagramType.replace("_", " ") : null}
      onClose={onClose}
    />
  )
}
