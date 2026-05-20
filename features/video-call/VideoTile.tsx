"use client"

import { useEffect, useRef } from "react"
import { MicOff, VideoOff } from "lucide-react"

interface VideoTileProps {
  stream: MediaStream | null
  name: string
  isLocal?: boolean
  muted?: boolean
  audioOff?: boolean
  videoOff?: boolean
}

export function VideoTile({
  stream,
  name,
  isLocal = false,
  muted = false,
  audioOff = false,
  videoOff = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-900 shadow-md">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || muted}
        className={`h-full w-full object-cover ${videoOff ? "opacity-0" : ""}`}
      />
      {videoOff && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-600 text-2xl font-semibold text-white">
            {name.slice(0, 2).toUpperCase()}
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-sm text-white">
        <span className="truncate font-medium">
          {name}
          {isLocal ? " (tú)" : ""}
        </span>
        <div className="flex items-center gap-1">
          {audioOff && <MicOff className="h-4 w-4" />}
          {videoOff && <VideoOff className="h-4 w-4" />}
        </div>
      </div>
    </div>
  )
}
