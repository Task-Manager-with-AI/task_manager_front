"use client"

import { FormEvent, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTranslation } from "@/components/locale-provider"
import { DiagramGallery } from "@/features/documents/components/DiagramGallery"
import { useProject } from "@/features/projects/projects.hooks"
import { documentsLogger, toShortErrorMessage } from "@/features/documents/documents.logger"
import {
  useCreateDocument,
  useDeleteDocument,
  useProjectDiagrams,
  useProjectDocuments,
} from "@/features/documents/documents.hooks"

export default function ProjectDocumentsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()
  const { t } = useTranslation()
  const { data: project } = useProject(projectId)
  const { data: documents, isLoading } = useProjectDocuments(projectId)
  const { data: diagrams, isLoading: isLoadingDiagrams } = useProjectDiagrams(projectId)
  const { mutateAsync: createDocument, isPending: isCreating } = useCreateDocument(projectId)
  const { mutate: deleteDocument, isPending: isDeleting } = useDeleteDocument(projectId)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return

    try {
      documentsLogger.debug({
        event: "projectDocuments:create:start",
        scope: "ui",
        projectId,
      })
      setActionError(null)
      const document = await createDocument({ title: cleanTitle })
      documentsLogger.info({
        event: "projectDocuments:create:success",
        scope: "ui",
        projectId,
        documentId: document.id,
      })
      setTitle("")
      setIsDialogOpen(false)
      router.push(`/documents/${document.id}`)
    } catch (error) {
      documentsLogger.error({
        event: "projectDocuments:create:error",
        scope: "ui",
        projectId,
        message: toShortErrorMessage(error),
      })
      setActionError(getErrorMessage(error, t("documents.createError")))
    }
  }

  const handleDelete = (documentId: string) => {
    documentsLogger.debug({
      event: "projectDocuments:delete:start",
      scope: "ui",
      projectId,
      documentId,
    })
    setActionError(null)
    deleteDocument(documentId, {
      onSuccess: () => {
        documentsLogger.info({
          event: "projectDocuments:delete:success",
          scope: "ui",
          projectId,
          documentId,
        })
      },
      onError: (error) => {
        documentsLogger.error({
          event: "projectDocuments:delete:error",
          scope: "ui",
          projectId,
          documentId,
          message: toShortErrorMessage(error),
        })
        setActionError(getErrorMessage(error, t("documents.deleteError")))
      },
    })
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("common.backToProject")}
            onClick={() => {
              documentsLogger.info({
                event: "projectDocuments:backToProject",
                scope: "ui",
                projectId,
              })
              router.push(`/projects/${projectId}`)
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              {t("documents.title")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {project?.name ?? t("documents.projectFallback")}
            </p>
          </div>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            documentsLogger.debug({
              event: "projectDocuments:createDialog:toggle",
              scope: "ui",
              projectId,
              status: open ? "open" : "closed",
            })
            setIsDialogOpen(open)
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">{t("documents.newDocument")}</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("documents.createTitle")}</DialogTitle>
              <DialogDescription>{t("documents.createDescription")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-title">{t("documents.nameLabel")}</Label>
                <Input
                  id="document-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={t("documents.namePlaceholder")}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating || !title.trim()}>
                  {isCreating ? t("documents.creating") : t("documents.create")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {actionError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/60">
                <TableHead>{t("documents.tableName")}</TableHead>
                <TableHead>{t("documents.tableOwner")}</TableHead>
                <TableHead>{t("documents.tableUpdated")}</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(documents ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-gray-400">
                    {t("documents.emptyState")}
                  </TableCell>
                </TableRow>
              )}
              {documents?.map((document) => (
                <TableRow
                  key={document.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  onClick={() => {
                    documentsLogger.info({
                      event: "projectDocuments:openDocument",
                      scope: "ui",
                      projectId,
                      documentId: document.id,
                    })
                    router.push(`/documents/${document.id}`)
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                      <FileText className="h-4 w-4 text-blue-600" />
                      {document.title}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {document.createdBy?.name ?? t("common.user")}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(document.updatedAt), "dd MMM yyyy HH:mm")}
                  </TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isDeleting}
                      aria-label={t("documents.delete")}
                      onClick={() => handleDelete(document.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-8">
        {isLoadingDiagrams ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <DiagramGallery
            diagrams={diagrams ?? []}
            title="Galería de Diagramas"
            emptyMessage="Los diagramas que generes desde este proyecto o sus documentos aparecerán aquí."
            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/40"
          />
        )}
      </div>
    </div>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
