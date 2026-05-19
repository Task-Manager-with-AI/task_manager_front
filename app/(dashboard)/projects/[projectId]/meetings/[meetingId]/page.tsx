"use client"

import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CalendarClock,
  FileText,
  Loader2,
  Users,
  Video,
} from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useMeeting } from "@/features/meetings/meetings.hooks"
import type { MeetingStatus } from "@/features/meetings/meetings.types"

const STATUS_COLORS: Record<MeetingStatus, string> = {
  SCHEDULED:
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  IN_PROGRESS:
    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  ENDED: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  PROCESSED:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
}

export default function MeetingDetailPage() {
  const params = useParams<{ projectId: string; meetingId: string }>()
  const router = useRouter()
  const { data: meeting, isLoading } = useMeeting(params.meetingId)

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Reunión no encontrada.</p>
        <Button
          variant="link"
          onClick={() => router.push(`/projects/${params.projectId}/meetings`)}
        >
          Volver
        </Button>
      </div>
    )
  }

  const canJoin = meeting.status === "SCHEDULED" || meeting.status === "IN_PROGRESS"
  const isProcessing = meeting.status === "ENDED"
  const hasMinutes = meeting.status === "PROCESSED" && Boolean(meeting.minute)

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Volver"
          onClick={() => router.push(`/projects/${params.projectId}/meetings`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {meeting.title}
            </h1>
            <Badge className={STATUS_COLORS[meeting.status]}>
              {meeting.status.replace("_", " ")}
            </Badge>
          </div>
          {meeting.description && (
            <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
              {meeting.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <CalendarClock className="h-4 w-4" />
            Programación
          </h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Programada</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {meeting.scheduledAt
                  ? format(new Date(meeting.scheduledAt), "dd MMM yyyy HH:mm")
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Iniciada</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {meeting.startedAt
                  ? format(new Date(meeting.startedAt), "dd MMM yyyy HH:mm")
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Finalizada</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {meeting.endedAt
                  ? format(new Date(meeting.endedAt), "dd MMM yyyy HH:mm")
                  : "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Users className="h-4 w-4" />
            Participantes ({meeting.participants.length})
          </h2>
          <ul className="space-y-1 text-sm">
            {meeting.participants.map((p) => (
              <li key={p.id} className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>{p.user.name}</span>
                <span className="text-xs text-gray-400">{p.user.email}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
            Acciones
          </h2>
          <div className="space-y-2">
            {canJoin && (
              <Button
                className="w-full"
                onClick={() =>
                  router.push(
                    `/projects/${params.projectId}/meetings/${meeting.id}/room`
                  )
                }
              >
                <Video className="h-4 w-4" />
                Unirse a la llamada
              </Button>
            )}
            {isProcessing && (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando audio y generando minutas...
              </div>
            )}
            {hasMinutes && (
              <Button
                className="w-full"
                variant="outline"
                onClick={() =>
                  router.push(
                    `/projects/${params.projectId}/meetings/${meeting.id}/minutes`
                  )
                }
              >
                <FileText className="h-4 w-4" />
                Ver minuta y sugerencias
              </Button>
            )}
            {meeting.status === "FAILED" && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                Error al procesar: {meeting.errorMessage ?? "desconocido"}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
