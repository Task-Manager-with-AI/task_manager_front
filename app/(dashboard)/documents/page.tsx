"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/components/locale-provider"
import { documentsLogger } from "@/features/documents/documents.logger"
import { useProjects } from "@/features/projects/projects.hooks"

export default function DocumentsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { data: projects, isLoading } = useProjects()

  useEffect(() => {
    if (projects?.length === 1) {
      documentsLogger.info({
        event: "documentsSelector:autoRedirect",
        scope: "ui",
        projectId: projects[0].id,
        count: projects.length,
      })
      router.replace(`/projects/${projects[0].id}/documents`)
    }
  }, [projects, router])

  useEffect(() => {
    if (isLoading) {
      documentsLogger.debug({
        event: "documentsSelector:projects:loading",
        scope: "ui",
      })
      return
    }

    documentsLogger.info({
      event: "documentsSelector:projects:ready",
      scope: "ui",
      count: projects?.length ?? 0,
    })
  }, [isLoading, projects?.length])

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          {t("documents.title")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("documents.selectProject")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(projects ?? []).map((project) => (
          <button
            key={project.id}
            className="rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
            onClick={() => {
              documentsLogger.info({
                event: "documentsSelector:openProjectDocuments",
                scope: "ui",
                projectId: project.id,
              })
              router.push(`/projects/${project.id}/documents`)
            }}
          >
            <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
              <FileText className="h-4 w-4 text-blue-600" />
              {project.name}
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t("documents.openProjectDocuments")}
            </p>
          </button>
        ))}
      </div>

      {(projects ?? []).length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("documents.noProjects")}</p>
          <Button
            className="mt-4"
            onClick={() => {
              documentsLogger.info({
                event: "documentsSelector:goToProjects",
                scope: "ui",
              })
              router.push("/projects")
            }}
          >
            {t("documents.goToProjects")}
          </Button>
        </div>
      )}
    </div>
  )
}
