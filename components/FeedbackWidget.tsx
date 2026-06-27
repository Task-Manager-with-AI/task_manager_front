"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { MessageCircle, Star, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useMutateFeedback } from "@/features/feedback/feedback.hooks"

const COOLDOWN_KEY = "feedback_last_sent"
const COOLDOWN_MS = 24 * 60 * 60 * 1000

function getPageContext(pathname: string): string {
  if (pathname.includes("/kanban")) return "kanban"
  if (pathname.includes("/meetings")) return "meetings"
  if (pathname.includes("/documents")) return "documents"
  if (pathname.includes("/chats")) return "chats"
  if (pathname.includes("/copilot")) return "copilot"
  if (pathname.includes("/dashboard")) return "dashboard"
  return "other"
}

export function FeedbackWidget() {
  // Start visible; only hide after effect confirms cooldown is active
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState("")
  const [sent, setSent] = useState(false)
  const pathname = usePathname()
  const { mutate, isPending } = useMutateFeedback()

  useEffect(() => {
    const last = localStorage.getItem(COOLDOWN_KEY)
    if (last && Date.now() - Number(last) < COOLDOWN_MS) {
      setHidden(true)
    }
  }, [])

  // Hide on routes where the widget overlaps existing UI (chat composer, copilot panel)
  const hideOnRoute = pathname.startsWith("/chats") || pathname.endsWith("/copilot")
  if (hidden || hideOnRoute) return null

  function handleOpen() {
    setSent(false)
    setRating(0)
    setComment("")
    setOpen(true)
  }

  function handleSubmit() {
    if (!rating) return
    mutate(
      { rating, comment: comment.trim() || undefined, page: getPageContext(pathname) },
      {
        onSuccess: () => {
          setSent(true)
          localStorage.setItem(COOLDOWN_KEY, String(Date.now()))
          // Keep widget visible (showing "thank you") until user closes it
        },
      }
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-80 rounded-2xl border border-border bg-background shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
          {sent ? (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">
                ¡Gracias por tu opinión!
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tu feedback nos ayuda a mejorar la plataforma.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setOpen(false); setHidden(true) }}
                className="mt-1"
              >
                Cerrar
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  ¿Cómo valorarías la app?
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 text-gray-400 hover:bg-muted hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className="transition-transform hover:scale-110"
                      aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={cn(
                          "h-8 w-8 transition-colors",
                          star <= (hovered || rating)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-none text-gray-300 dark:text-gray-600"
                        )}
                      />
                    </button>
                  ))}
                </div>

                {rating > 0 && (
                  <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                    {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][rating]}
                  </p>
                )}

                <Textarea
                  placeholder="Cuéntanos más (opcional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="resize-none text-sm"
                />

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={!rating || isPending}
                    onClick={handleSubmit}
                  >
                    {isPending ? "Enviando…" : "Enviar"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={handleOpen}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
          aria-label="Dar feedback"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
