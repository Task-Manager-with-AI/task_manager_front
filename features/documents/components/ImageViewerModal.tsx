"use client"

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { Minus, Plus, RotateCcw, Scan, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type ImageViewerModalProps = {
  alt?: string
  isOpen: boolean
  onClose: () => void
  src: string | null
  subtitle?: string | null
  title?: string | null
}

export function ImageViewerModal({
  alt,
  isOpen,
  onClose,
  src,
  subtitle,
  title,
}: ImageViewerModalProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStateRef = useRef({
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  })

  useEffect(() => {
    if (!isOpen) return
    setScale(1)
    setNaturalSize({ width: 0, height: 0 })
  }, [isOpen, src])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  const resolvedTitle = useMemo(() => title?.trim() || "Imagen", [title])

  if (!isOpen || !src) return null

  const zoomIn = () => setScale((current) => Math.min(current + 0.2, 4))
  const zoomOut = () => setScale((current) => Math.max(current - 0.2, 0.4))
  const reset = () => setScale(1)
  const fitToScreen = () => {
    const container = scrollRef.current
    if (!container || !naturalSize.width || !naturalSize.height) return

    const widthScale = (container.clientWidth - 48) / naturalSize.width
    const heightScale = (container.clientHeight - 48) / naturalSize.height
    setScale(Math.max(0.3, Math.min(widthScale, heightScale, 1.5)))
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current
    if (!container) return

    setIsDragging(true)
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const container = scrollRef.current
    if (!container) return

    const deltaX = event.clientX - dragStateRef.current.startX
    const deltaY = event.clientY - dragStateRef.current.startY
    container.scrollLeft = dragStateRef.current.scrollLeft - deltaX
    container.scrollTop = dragStateRef.current.scrollTop - deltaY
  }

  const stopDragging = () => {
    setIsDragging(false)
  }

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-slate-950/95 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
        <div>
          <div className="text-lg font-semibold">{resolvedTitle}</div>
          {subtitle ? <div className="text-sm text-slate-300">{subtitle}</div> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="icon" onClick={zoomOut} title="Alejar">
            <Minus className="h-4 w-4" />
          </Button>
          <Button type="button" variant="secondary" size="icon" onClick={zoomIn} title="Acercar">
            <Plus className="h-4 w-4" />
          </Button>
          <Button type="button" variant="secondary" size="icon" onClick={reset} title="Reset">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button type="button" variant="secondary" size="icon" onClick={fitToScreen} title="Ajustar a pantalla">
            <Scan className="h-4 w-4" />
          </Button>
          <Button type="button" variant="secondary" size="icon" onClick={onClose} title="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={`flex-1 overflow-auto p-6 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerLeave={stopDragging}
      >
        <div className="flex min-h-full min-w-full items-center justify-center">
          <img
            src={src}
            alt={alt || resolvedTitle}
            className="max-w-none rounded-xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.45)]"
            style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
            onLoad={(event) => {
              setNaturalSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
}
