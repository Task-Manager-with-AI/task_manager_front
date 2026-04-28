"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useProject } from "@/features/projects/projects.hooks"
import { useProjectTasks, useUpdateTaskStatus } from "@/features/tasks/tasks.hooks"
import { KanbanBoard } from "@/features/kanban/KanbanBoard"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { TaskStatus } from "@/features/tasks/tasks.types"

export default function KanbanPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()

  const { data: project } = useProject(projectId)
  const { data: tasks, isLoading } = useProjectTasks(projectId)
  const { mutate: updateStatus } = useUpdateTaskStatus(projectId)

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateStatus({ taskId, status })
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/projects/${projectId}`)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kanban Board</h1>
          {project && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{project.name}</p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <KanbanBoard tasks={tasks ?? []} onStatusChange={handleStatusChange} />
      )}
    </div>
  )
}
