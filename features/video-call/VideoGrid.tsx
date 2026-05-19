"use client"

import { VideoTile } from "./VideoTile"
import type { RemoteStream } from "./useWebRTC"

interface VideoGridProps {
  localStream: MediaStream | null
  localName: string
  audioOff: boolean
  videoOff: boolean
  remoteStreams: RemoteStream[]
}

function getGridClass(count: number) {
  if (count <= 1) return "grid-cols-1"
  if (count <= 2) return "grid-cols-1 md:grid-cols-2"
  if (count <= 4) return "grid-cols-2"
  return "grid-cols-2 md:grid-cols-3"
}

export function VideoGrid({
  localStream,
  localName,
  audioOff,
  videoOff,
  remoteStreams,
}: VideoGridProps) {
  const total = 1 + remoteStreams.length
  return (
    <div className={`grid gap-3 p-4 ${getGridClass(total)}`}>
      <VideoTile
        stream={localStream}
        name={localName}
        isLocal
        audioOff={audioOff}
        videoOff={videoOff}
      />
      {remoteStreams.map((rs) => (
        <VideoTile key={rs.userId} stream={rs.stream} name={rs.name} />
      ))}
    </div>
  )
}
