"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useMeeting } from "@/features/meetings/meetings.hooks"

/**
 * Redirect page: notifications may link to /meetings/:meetingId (without
 * projectId). Fetch the meeting to get its projectId, then forward to the
 * real project-scoped URL.
 */
export default function MeetingRedirectPage() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const router = useRouter()
  const { data: meeting, error } = useMeeting(meetingId)

  useEffect(() => {
    if (meeting) {
      router.replace(`/projects/${meeting.projectId}/meetings/${meeting.id}`)
    }
  }, [meeting, router])

  useEffect(() => {
    if (error) {
      router.replace("/meetings")
    }
  }, [error, router])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  )
}
