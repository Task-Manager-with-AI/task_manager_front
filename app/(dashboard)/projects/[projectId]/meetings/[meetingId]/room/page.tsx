"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { VideoCallRoom } from "@/features/video-call/VideoCallRoom"
import { useMeeting, useStartMeeting } from "@/features/meetings/meetings.hooks"
import { useCurrentUser } from "@/features/auth/auth.hooks"
import { ApiError } from "@/lib/api-client"

export default function MeetingRoomPage() {
  const params = useParams<{ projectId: string; meetingId: string }>()
  const router = useRouter()
  const { data: meeting, isLoading, error } = useMeeting(params.meetingId)
  const { data: me } = useCurrentUser()
  const startMutation = useStartMeeting()

  // BUG-03: redirect to access-denied page when the user is not a project member
  useEffect(() => {
    if (!error) return
    const status = error instanceof ApiError ? error.status : 0
    if (status === 403 || status === 404) {
      router.replace("/meetings/access-denied")
    }
  }, [error, router])

  useEffect(() => {
    if (
      meeting &&
      meeting.status === "SCHEDULED" &&
      !startMutation.isPending &&
      !startMutation.isSuccess
    ) {
      startMutation.mutate(meeting.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meeting])

  useEffect(() => {
    if (!meeting) return
    if (meeting.status === "ENDED" || meeting.status === "PROCESSED") {
      router.replace(`/projects/${params.projectId}/meetings/${meeting.id}`)
    }
  }, [meeting, params.projectId, router])

  if (isLoading || !meeting || !me) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <VideoCallRoom
      meetingId={meeting.id}
      meetingTitle={meeting.title}
      projectId={params.projectId}
      localUserName={me.name}
      isHost={me.id === meeting.createdById}
    />
  )
}
