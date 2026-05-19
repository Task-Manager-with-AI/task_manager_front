"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, Video } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useProject } from "@/features/projects/projects.hooks"
import { useProjectMeetings } from "@/features/meetings/meetings.hooks"
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

export default function MeetingsListPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()
  const { data: project } = useProject(projectId)
  const { data: meetings, isLoading } = useProjectMeetings(projectId)

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Volver al proyecto"
            onClick={() => router.push(`/projects/${projectId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reuniones
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {project?.name ?? "Proyecto"}
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/projects/${projectId}/meetings/new`)}>
          <Plus className="h-4 w-4" />
          Nueva reunión
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/60">
                <TableHead>Título</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Participantes</TableHead>
                <TableHead>Programada</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(meetings ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-gray-400">
                    Aún no hay reuniones. Crea la primera.
                  </TableCell>
                </TableRow>
              )}
              {meetings?.map((meeting) => (
                <TableRow
                  key={meeting.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  onClick={() =>
                    router.push(`/projects/${projectId}/meetings/${meeting.id}`)
                  }
                >
                  <TableCell className="font-medium text-gray-900 dark:text-white">
                    {meeting.title}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[meeting.status]}>
                      {meeting.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {meeting.participants.length}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {meeting.scheduledAt
                      ? format(new Date(meeting.scheduledAt), "dd MMM yyyy HH:mm")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(meeting.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {(meeting.status === "SCHEDULED" ||
                      meeting.status === "IN_PROGRESS") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(
                            `/projects/${projectId}/meetings/${meeting.id}/room`
                          )
                        }
                      >
                        <Video className="h-4 w-4" />
                        Unirse
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
