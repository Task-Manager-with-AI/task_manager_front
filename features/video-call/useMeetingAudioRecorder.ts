"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { RemoteStream } from "./useWebRTC"

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

function hasAudioTrack(stream: MediaStream): boolean {
  return stream.getAudioTracks().some((track) => track.readyState === "live")
}

export function useMeetingAudioRecorder(
  localStream: MediaStream | null,
  remoteStreams: RemoteStream[]
) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const sourcesRef = useRef<Map<string, MediaStreamAudioSourceNode>>(new Map())
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [state, setState] = useState<RecorderState>("idle")
  const [mimeType, setMimeType] = useState("")

  const ensureAudioGraph = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
      destinationRef.current = audioContextRef.current.createMediaStreamDestination()
    }
    return {
      ctx: audioContextRef.current,
      destination: destinationRef.current!,
    }
  }, [])

  const cleanupGraph = useCallback(() => {
    for (const source of sourcesRef.current.values()) {
      source.disconnect()
    }
    sourcesRef.current.clear()
    destinationRef.current = null
    if (audioContextRef.current) {
      void audioContextRef.current.close()
      audioContextRef.current = null
    }
  }, [])

  const syncSources = useCallback(() => {
    const { ctx, destination } = ensureAudioGraph()
    const activeIds = new Set<string>()

    const attach = (id: string, stream: MediaStream) => {
      if (!hasAudioTrack(stream)) return
      activeIds.add(id)
      if (sourcesRef.current.has(id)) return

      const audioOnly = new MediaStream(stream.getAudioTracks())
      const source = ctx.createMediaStreamSource(audioOnly)
      source.connect(destination)
      sourcesRef.current.set(id, source)
    }

    if (localStream) attach("local", localStream)
    for (const remote of remoteStreams) attach(remote.userId, remote.stream)

    for (const [id, source] of sourcesRef.current) {
      if (!activeIds.has(id)) {
        source.disconnect()
        sourcesRef.current.delete(id)
      }
    }
  }, [localStream, remoteStreams, ensureAudioGraph])

  const start = useCallback(() => {
    if (!localStream || recorderRef.current) return

    syncSources()
    const destination = destinationRef.current
    if (!destination) return

    const selected = pickMimeType()
    let recorder: MediaRecorder
    try {
      recorder = selected
        ? new MediaRecorder(destination.stream, { mimeType: selected })
        : new MediaRecorder(destination.stream)
    } catch (err) {
      console.error("Failed to start meeting recorder", err)
      return
    }

    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.start(5000)
    recorderRef.current = recorder
    setMimeType(recorder.mimeType || selected || "audio/webm")
    setState("recording")
  }, [localStream, syncSources])

  useEffect(() => {
    if (state === "recording") syncSources()
  }, [localStream, remoteStreams, state, syncSources])

  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current
      if (!recorder || recorder.state === "inactive") {
        cleanupGraph()
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
        cleanupGraph()
        resolve(blob)
      }
      recorder.stop()
    })
  }, [mimeType, cleanupGraph])

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
      cleanupGraph()
    }
  }, [cleanupGraph])

  return { start, stop, state, mimeType }
}
