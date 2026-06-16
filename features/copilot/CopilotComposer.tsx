"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { Send, Mic, Square, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { copilotApi } from "./copilot.api"

interface Props {
  onSend: (question: string) => void
  disabled?: boolean
}

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return ""
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? ""
}

/**
 * Composer with voice dictation powered by the backend (Whisper), not the
 * browser Speech API: it records a short clip with MediaRecorder, uploads it,
 * and inserts the returned transcript. Reliable even where the native Speech
 * API is blocked.
 */
export function CopilotComposer({ onSend, disabled }: Props) {
  const [value, setValue] = useState("")
  const [supported, setSupported] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const baseTextRef = useRef("")

  useEffect(() => {
    setSupported(
      typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined"
    )
    return () => {
      recorderRef.current?.state === "recording" && recorderRef.current.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const submit = () => {
    const q = value.trim()
    if (!q || disabled) return
    onSend(q)
    setValue("")
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const startRecording = async () => {
    setVoiceError(null)
    baseTextRef.current = value.trim()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = pickMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        const type = recorder.mimeType || "audio/webm"
        const blob = new Blob(chunksRef.current, { type })
        chunksRef.current = []
        if (blob.size === 0) return

        setIsTranscribing(true)
        try {
          const ext = type.includes("mp4") ? "mp4" : type.includes("ogg") ? "ogg" : "webm"
          const transcript = (await copilotApi.transcribe(blob, `dictation.${ext}`)).trim()
          if (transcript) {
            setValue([baseTextRef.current, transcript].filter(Boolean).join(" ").trim())
          } else {
            setVoiceError("No se entendió el audio. Intenta de nuevo.")
          }
        } catch (err) {
          setVoiceError((err as Error).message || "No se pudo transcribir el audio.")
        } finally {
          setIsTranscribing(false)
        }
      }

      recorder.start()
      recorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      const name = (err as Error).name
      setVoiceError(
        name === "NotAllowedError"
          ? "Permiso de micrófono denegado. Habilítalo en el navegador."
          : name === "NotFoundError"
            ? "No se detectó un micrófono."
            : "No se pudo acceder al micrófono."
      )
    }
  }

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop()
    setIsRecording(false)
  }

  const toggleMic = () => {
    if (isRecording) stopRecording()
    else void startRecording()
  }

  const micBusy = isTranscribing || disabled

  return (
    <div className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {voiceError && (
        <p className="px-3 pt-2 text-xs text-red-600 dark:text-red-400">{voiceError}</p>
      )}
      {isRecording && (
        <p className="flex items-center gap-1.5 px-3 pt-2 text-xs text-red-600 dark:text-red-400">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-600" />
          Grabando… pulsa el botón para detener y transcribir.
        </p>
      )}
      <div className="flex items-end gap-2 p-3">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isTranscribing
              ? "Transcribiendo tu voz…"
              : "Pregúntale al proyecto… (ej. ¿qué reportes hay disponibles?)"
          }
          rows={1}
          className="max-h-40 min-h-[44px] flex-1 resize-none"
          disabled={disabled}
        />

        {supported && (
          <Button
            type="button"
            onClick={toggleMic}
            disabled={micBusy}
            size="icon"
            variant={isRecording ? "default" : "outline"}
            className={cn(
              "h-11 w-11 shrink-0",
              isRecording && "bg-red-600 hover:bg-red-700"
            )}
            aria-label={isRecording ? "Detener y transcribir" : "Dictar por voz"}
            title={isRecording ? "Detener y transcribir" : "Dictar por voz"}
          >
            {isTranscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isRecording ? (
              <Square className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}

        <Button
          onClick={submit}
          disabled={disabled || !value.trim()}
          size="icon"
          className="h-11 w-11 shrink-0"
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
