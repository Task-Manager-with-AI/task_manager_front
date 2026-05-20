"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type RecorderState = "idle" | "recording" | "stopped"

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ]
  for (const m of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) {
      return m
    }
  }
  return ""
}

export function useAudioRecorder(stream: MediaStream | null) {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [state, setState] = useState<RecorderState>("idle")
  const [mimeType, setMimeType] = useState("")

  const start = useCallback(() => {
    if (!stream || recorderRef.current) return

    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0) return
    const audioStream = new MediaStream(audioTracks)

    const selected = pickMimeType()
    let recorder: MediaRecorder
    try {
      recorder = selected
        ? new MediaRecorder(audioStream, { mimeType: selected })
        : new MediaRecorder(audioStream)
    } catch (err) {
      console.error("Failed to start MediaRecorder", err)
      return
    }

    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => setState("stopped")
    recorder.start(5000)
    recorderRef.current = recorder
    setMimeType(recorder.mimeType || selected || "audio/webm")
    setState("recording")
  }, [stream])

  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current
      if (!recorder || recorder.state === "inactive") {
        resolve(null)
        return
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        })
        chunksRef.current = []
        recorderRef.current = null
        setState("stopped")
        resolve(blob)
      }
      recorder.stop()
    })
  }, [mimeType])

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop()
        } catch {
          // ignore
        }
      }
    }
  }, [])

  return { start, stop, state, mimeType }
}
