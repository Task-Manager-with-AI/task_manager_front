"use client"

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Download, FileCog, FileUp, MessageSquarePlus, Paperclip, Save, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTranslation } from "@/components/locale-provider"
import { useCurrentUser } from "@/features/auth/auth.hooks"
import { documentsApi } from "@/features/documents/documents.api"
import { documentsLogger, toShortErrorMessage } from "@/features/documents/documents.logger"
import {
  useAddComment,
  useCommentThreads,
  useConversionJobs,
  useCreateCommentThread,
  useCreateConversionJob,
  useCreateDocumentVersion,
  useCreateSuggestion,
  useDeleteDocumentAsset,
  useDocument,
  useDocumentAssets,
  useDocumentVersions,
  useResolveSuggestion,
  useResolveThread,
  useRestoreVersion,
  useSuggestions,
  useUpdateDocument,
  useUploadDocumentAsset,
  useVersionDiff,
} from "@/features/documents/documents.hooks"
import type { DocumentPermissionRole } from "@/features/documents/documents.types"

const CollaborativeEditor = dynamic(
  () => import("@/features/documents/collaborative-editor").then((module) => module.CollaborativeEditor),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[70vh] w-full" />,
  }
)

const ProCollaborativeEditor = dynamic(
  () =>
    import("@/features/documents/pro-collaborative-editor").then(
      (module) => module.ProCollaborativeEditor
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[70vh] w-full" />,
  }
)

const useProEditor = process.env.NEXT_PUBLIC_USE_PROSEMIRROR_EDITOR !== "false"

export default function DocumentEditorPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const router = useRouter()
  const { t } = useTranslation()
  const { data: document, isLoading } = useDocument(documentId)
  const { data: currentUser } = useCurrentUser()
  const { mutateAsync: updateDocument, isPending: isSaving } = useUpdateDocument()
  const { mutateAsync: uploadAsset, isPending: isUploading } = useUploadDocumentAsset(documentId)
  const { data: assets, isLoading: isAssetsLoading } = useDocumentAssets(documentId)
  const { mutateAsync: deleteAsset, isPending: isDeletingAsset } = useDeleteDocumentAsset(documentId)
  const { data: commentThreads } = useCommentThreads(documentId, true)
  const { mutateAsync: createThread, isPending: isCreatingThread } = useCreateCommentThread(documentId)
  const { mutateAsync: addComment, isPending: isAddingComment } = useAddComment(documentId)
  const { mutateAsync: resolveThread, isPending: isResolvingThread } = useResolveThread(documentId)
  const { data: suggestions } = useSuggestions(documentId)
  const { mutateAsync: createSuggestion, isPending: isCreatingSuggestion } = useCreateSuggestion(documentId)
  const { mutateAsync: resolveSuggestion, isPending: isResolvingSuggestion } = useResolveSuggestion(documentId)
  const { data: versions } = useDocumentVersions(documentId, 30)
  const { mutateAsync: createVersion, isPending: isCreatingVersion } = useCreateDocumentVersion(documentId)
  const { mutateAsync: restoreVersion, isPending: isRestoringVersion } = useRestoreVersion(documentId)
  const { data: conversionJobs } = useConversionJobs(documentId)
  const { mutateAsync: createConversionJob, isPending: isCreatingConversionJob } =
    useCreateConversionJob(documentId)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const importFileInputRef = useRef<HTMLInputElement | null>(null)
  const trackTimerRef = useRef<number | null>(null)
  const pendingTrackRef = useRef<{ inserted: number; deleted: number }>({ inserted: 0, deleted: 0 })
  const [title, setTitle] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)
  const [newThreadText, setNewThreadText] = useState("")
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [suggestionDraft, setSuggestionDraft] = useState("")
  const [diffSelection, setDiffSelection] = useState<{ fromVersionId?: string; toVersionId?: string }>({})

  const { data: selectedDiff } = useVersionDiff(
    documentId,
    diffSelection.fromVersionId,
    diffSelection.toVersionId
  )

  const accessRole: DocumentPermissionRole = document?.accessRole ?? "EDITOR"

  useEffect(() => {
    if (document?.title) {
      setTitle(document.title)
      documentsLogger.info({
        event: "documentEditor:loaded",
        scope: "ui",
        documentId,
        status: document.accessRole ?? "EDITOR",
      })
    }
  }, [document?.title])

  useEffect(() => {
    return () => {
      if (trackTimerRef.current) {
        window.clearTimeout(trackTimerRef.current)
      }
      documentsLogger.info({
        event: "documentEditor:unmount",
        scope: "ui",
        documentId,
      })
    }
  }, [])

  useEffect(() => {
    if (!actionError) return
    documentsLogger.warn({
      event: "documentEditor:actionError",
      scope: "ui",
      documentId,
      message: actionError,
    })
  }, [actionError, documentId])

  const latestVersionId = versions?.[0]?.id
  const latestImportResultVersionId = useMemo(() => {
    const latestImport = (conversionJobs ?? []).find(
      (job) =>
        job.type === "IMPORT_DOCX" &&
        job.status === "COMPLETED" &&
        Boolean(job.resultVersionId)
    )
    return latestImport?.resultVersionId ?? null
  }, [conversionJobs])

  const handleRename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!document || !cleanTitle || cleanTitle === document.title) return

    try {
      documentsLogger.debug({
        event: "documentEditor:rename:start",
        scope: "ui",
        documentId,
      })
      setActionError(null)
      await updateDocument({
        documentId,
        dto: {
          title: cleanTitle,
        },
      })
      documentsLogger.info({
        event: "documentEditor:rename:success",
        scope: "ui",
        documentId,
      })
    } catch (error) {
      documentsLogger.error({
        event: "documentEditor:rename:error",
        scope: "ui",
        documentId,
        message: toShortErrorMessage(error),
      })
      setActionError(getErrorMessage(error, t("documents.renameError")))
    }
  }

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      documentsLogger.debug({
        event: "documentEditor:assetUpload:start",
        scope: "ui",
        documentId,
        sizeBytes: file.size,
      })
      setActionError(null)
      await uploadAsset(file)
      documentsLogger.info({
        event: "documentEditor:assetUpload:success",
        scope: "ui",
        documentId,
      })
      event.target.value = ""
    } catch (error) {
      documentsLogger.error({
        event: "documentEditor:assetUpload:error",
        scope: "ui",
        documentId,
        message: toShortErrorMessage(error),
      })
      setActionError(getErrorMessage(error, t("documents.uploadError")))
    }
  }

  const handleImportDocx = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      documentsLogger.debug({
        event: "documentEditor:importDocx:start",
        scope: "ui",
        documentId,
        sizeBytes: file.size,
      })
      setActionError(null)

      if (!file.name.toLowerCase().endsWith(".docx")) {
        throw new Error("Solo se permiten archivos DOCX para importar.")
      }

      const asset = await uploadAsset(file)
      await createConversionJob({
        type: "IMPORT_DOCX",
        inputAssetId: asset.id,
      })
      documentsLogger.info({
        event: "documentEditor:importDocx:queued",
        scope: "ui",
        documentId,
        assetId: asset.id,
      })
      event.target.value = ""
    } catch (error) {
      documentsLogger.error({
        event: "documentEditor:importDocx:error",
        scope: "ui",
        documentId,
        message: toShortErrorMessage(error),
      })
      setActionError(getErrorMessage(error, "No se pudo importar el archivo DOCX."))
    }
  }

  const handleDownload = (assetId: string) => {
    documentsLogger.debug({
      event: "documentEditor:assetDownload:start",
      scope: "ui",
      documentId,
      assetId,
    })
    setActionError(null)
    const opened = window.open(documentsApi.assetDownloadUrl(documentId, assetId), "_blank")

    if (!opened) {
      documentsLogger.warn({
        event: "documentEditor:assetDownload:blocked",
        scope: "ui",
        documentId,
        assetId,
      })
      setActionError(t("documents.downloadError"))
    } else {
      documentsLogger.info({
        event: "documentEditor:assetDownload:success",
        scope: "ui",
        documentId,
        assetId,
      })
    }
  }

  const handleDeleteAsset = async (assetId: string) => {
    try {
      documentsLogger.debug({
        event: "documentEditor:assetDelete:start",
        scope: "ui",
        documentId,
        assetId,
      })
      setActionError(null)
      await deleteAsset(assetId)
      documentsLogger.info({
        event: "documentEditor:assetDelete:success",
        scope: "ui",
        documentId,
        assetId,
      })
    } catch (error) {
      documentsLogger.error({
        event: "documentEditor:assetDelete:error",
        scope: "ui",
        documentId,
        assetId,
        message: toShortErrorMessage(error),
      })
      setActionError(getErrorMessage(error, t("documents.deleteAssetError")))
    }
  }

  const handleCreateThread = async () => {
    if (!newThreadText.trim()) return
    try {
      documentsLogger.debug({
        event: "documentEditor:commentThreadCreate:start",
        scope: "ui",
        documentId,
      })
      await createThread({ body: newThreadText.trim(), mentions: [] })
      documentsLogger.info({
        event: "documentEditor:commentThreadCreate:success",
        scope: "ui",
        documentId,
      })
      setNewThreadText("")
    } catch (error) {
      documentsLogger.error({
        event: "documentEditor:commentThreadCreate:error",
        scope: "ui",
        documentId,
        message: toShortErrorMessage(error),
      })
      setActionError(getErrorMessage(error, "Could not create comment thread."))
    }
  }

  const handleAddComment = async (threadId: string) => {
    const body = commentDrafts[threadId]?.trim()
    if (!body) return

    try {
      documentsLogger.debug({
        event: "documentEditor:commentAdd:start",
        scope: "ui",
        documentId,
        threadId,
      })
      await addComment({ threadId, body, mentions: [] })
      documentsLogger.info({
        event: "documentEditor:commentAdd:success",
        scope: "ui",
        documentId,
        threadId,
      })
      setCommentDrafts((prev) => ({ ...prev, [threadId]: "" }))
    } catch (error) {
      documentsLogger.error({
        event: "documentEditor:commentAdd:error",
        scope: "ui",
        documentId,
        threadId,
        message: toShortErrorMessage(error),
      })
      setActionError(getErrorMessage(error, "Could not add comment."))
    }
  }

  const handleCreateSuggestion = async () => {
    if (!suggestionDraft.trim()) return
    try {
      documentsLogger.debug({
        event: "documentEditor:suggestionCreate:start",
        scope: "ui",
        documentId,
      })
      await createSuggestion({
        type: "REPLACE",
        note: suggestionDraft.trim(),
      })
      documentsLogger.info({
        event: "documentEditor:suggestionCreate:success",
        scope: "ui",
        documentId,
      })
      setSuggestionDraft("")
    } catch (error) {
      documentsLogger.error({
        event: "documentEditor:suggestionCreate:error",
        scope: "ui",
        documentId,
        message: toShortErrorMessage(error),
      })
      setActionError(getErrorMessage(error, "Could not create suggestion."))
    }
  }

  const handleToggleThreadResolution = async (threadId: string, resolved: boolean) => {
    try {
      documentsLogger.debug({
        event: "documentEditor:commentThreadResolve:start",
        scope: "ui",
        documentId,
        threadId,
        status: resolved ? "resolve" : "reopen",
      })
      await resolveThread({ threadId, resolved })
      documentsLogger.info({
        event: "documentEditor:commentThreadResolve:success",
        scope: "ui",
        documentId,
        threadId,
        status: resolved ? "resolved" : "reopened",
      })
    } catch (error) {
      documentsLogger.error({
        event: "documentEditor:commentThreadResolve:error",
        scope: "ui",
        documentId,
        threadId,
        message: toShortErrorMessage(error),
      })
      setActionError(getErrorMessage(error, "Could not update comment thread state."))
    }
  }

  const handleResolveSuggestionAction = async (
    suggestionId: string,
    status: "ACCEPTED" | "REJECTED"
  ) => {
    try {
      documentsLogger.debug({
        event: "documentEditor:suggestionResolve:start",
        scope: "ui",
        documentId,
        suggestionId,
        status,
      })
      await resolveSuggestion({ suggestionId, status })
      documentsLogger.info({
        event: "documentEditor:suggestionResolve:success",
        scope: "ui",
        documentId,
        suggestionId,
        status,
      })
    } catch (error) {
      documentsLogger.error({
        event: "documentEditor:suggestionResolve:error",
        scope: "ui",
        documentId,
        suggestionId,
        message: toShortErrorMessage(error),
      })
      setActionError(getErrorMessage(error, "Could not resolve suggestion."))
    }
  }

  const handleRestoreVersionAction = async (versionId: string) => {
    try {
      documentsLogger.debug({
        event: "documentEditor:versionRestore:start",
        scope: "ui",
        documentId,
        versionId,
      })
      await restoreVersion(versionId)
      documentsLogger.info({
        event: "documentEditor:versionRestore:success",
        scope: "ui",
        documentId,
        versionId,
      })
    } catch (error) {
      documentsLogger.error({
        event: "documentEditor:versionRestore:error",
        scope: "ui",
        documentId,
        versionId,
        message: toShortErrorMessage(error),
      })
      setActionError(getErrorMessage(error, "No se pudo restaurar la versión."))
    }
  }

  const handleApplyLatestImport = async () => {
    if (!latestImportResultVersionId) {
      documentsLogger.warn({
        event: "documentEditor:applyLatestImport:missingVersion",
        scope: "ui",
        documentId,
      })
      setActionError("No hay una importación completada para aplicar.")
      return
    }

    try {
      documentsLogger.debug({
        event: "documentEditor:applyLatestImport:start",
        scope: "ui",
        documentId,
        versionId: latestImportResultVersionId,
      })
      setActionError(null)
      await restoreVersion(latestImportResultVersionId)
      documentsLogger.info({
        event: "documentEditor:applyLatestImport:success",
        scope: "ui",
        documentId,
        versionId: latestImportResultVersionId,
      })
    } catch (error) {
      documentsLogger.error({
        event: "documentEditor:applyLatestImport:error",
        scope: "ui",
        documentId,
        versionId: latestImportResultVersionId,
        message: toShortErrorMessage(error),
      })
      setActionError(getErrorMessage(error, "No se pudo aplicar la última importación."))
    }
  }

  const handleCreateSnapshot = async () => {
    try {
      documentsLogger.debug({
        event: "documentEditor:snapshot:start",
        scope: "ui",
        documentId,
      })
      await createVersion({ source: "manual_checkpoint" })
      documentsLogger.info({
        event: "documentEditor:snapshot:success",
        scope: "ui",
        documentId,
      })
    } catch (error) {
      documentsLogger.error({
        event: "documentEditor:snapshot:error",
        scope: "ui",
        documentId,
        message: toShortErrorMessage(error),
      })
      setActionError(getErrorMessage(error, "No se pudo crear snapshot."))
    }
  }

  const handleExportDocx = async () => {
    if (!latestVersionId) return
    const safeTitle = document?.title ?? "document"
    try {
      documentsLogger.debug({
        event: "documentEditor:exportDocx:start",
        scope: "ui",
        documentId,
        versionId: latestVersionId,
      })
      await createConversionJob({
        type: "EXPORT_DOCX",
        sourceVersionId: latestVersionId,
        requestedFileName: `${safeTitle}.docx`,
      })
      documentsLogger.info({
        event: "documentEditor:exportDocx:queued",
        scope: "ui",
        documentId,
        versionId: latestVersionId,
      })
    } catch (error) {
      documentsLogger.error({
        event: "documentEditor:exportDocx:error",
        scope: "ui",
        documentId,
        versionId: latestVersionId,
        message: toShortErrorMessage(error),
      })
      setActionError(getErrorMessage(error, "No se pudo exportar DOCX."))
    }
  }

  const editorUser = useMemo(
    () => ({ id: currentUser?.id ?? "", name: currentUser?.name ?? "User" }),
    [currentUser?.id, currentUser?.name]
  )

  const handleTrackedChange = (change: { inserted: number; deleted: number; summary: string }) => {
    if (accessRole !== "EDITOR") return

    pendingTrackRef.current = {
      inserted: pendingTrackRef.current.inserted + change.inserted,
      deleted: pendingTrackRef.current.deleted + change.deleted,
    }

    if (trackTimerRef.current) {
      window.clearTimeout(trackTimerRef.current)
    }

    trackTimerRef.current = window.setTimeout(() => {
      const payload = pendingTrackRef.current
      pendingTrackRef.current = { inserted: 0, deleted: 0 }

      if (payload.inserted === 0 && payload.deleted === 0) return

      documentsLogger.debug({
        event: "documentEditor:trackChanges:batch",
        scope: "editor",
        documentId,
        count: payload.inserted + payload.deleted,
        status: `inserted:${payload.inserted}|deleted:${payload.deleted}`,
      })

      void createSuggestion({
        type: "FORMAT",
        note: `Auto tracked changes: inserted ${payload.inserted} chars, deleted ${payload.deleted} chars`,
        payload: {
          inserted: payload.inserted,
          deleted: payload.deleted,
          source: "prosemirror-transaction",
        },
      })
    }, 1500)
  }

  if (isLoading || !document || !currentUser) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton className="mb-4 h-14 w-full" />
        <Skeleton className="h-[70vh] w-full" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("documents.backToDocuments")}
            onClick={() => {
              documentsLogger.info({
                event: "documentEditor:backToProjectDocuments",
                scope: "ui",
                documentId,
                projectId: document.projectId,
              })
              router.push(`/projects/${document.projectId}/documents`)
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <form onSubmit={handleRename} className="flex min-w-0 flex-1 items-center gap-2">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="min-w-0 max-w-xl text-base font-semibold"
              aria-label={t("documents.nameLabel")}
            />
            <Button
              type="submit"
              size="icon"
              variant="outline"
              disabled={isSaving || !title.trim() || title.trim() === document.title}
              aria-label={t("documents.saveTitle")}
              title={t("documents.saveTitle")}
            >
              <Save className="h-4 w-4" />
            </Button>
          </form>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
          <input
            ref={importFileInputRef}
            type="file"
            className="hidden"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleImportDocx}
          />
          <Button type="button" variant="outline" size="sm" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">{isUploading ? t("documents.uploading") : t("documents.attachFile")}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isCreatingVersion}
            onClick={handleCreateSnapshot}
          >
            <Save className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Snapshot</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isCreatingConversionJob || !latestVersionId}
            onClick={handleExportDocx}
          >
            <FileCog className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Export DOCX</span>
          </Button>
        </div>
      </div>

      <div className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Access role: {accessRole}
      </div>

      {actionError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {actionError}
        </div>
      )}

      {useProEditor ? (
        <ProCollaborativeEditor
          documentId={documentId}
          user={editorUser}
          accessRole={accessRole}
          onTrackChange={handleTrackedChange}
        />
      ) : (
        <CollaborativeEditor documentId={documentId} user={editorUser} />
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Comentarios</h2>
          <div className="mb-3 flex gap-2">
            <Textarea
              value={newThreadText}
              onChange={(event) => setNewThreadText(event.target.value)}
              placeholder="Nuevo comentario..."
              className="min-h-[72px]"
            />
            <Button type="button" size="sm" disabled={isCreatingThread || accessRole === "VIEWER"} onClick={handleCreateThread}>
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-[320px] space-y-3 overflow-y-auto">
            {(commentThreads ?? []).map((thread) => (
              <div key={thread.id} className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                  <span>{thread.isResolved ? "Resuelto" : "Abierto"}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={isResolvingThread || accessRole === "VIEWER"}
                    onClick={() => handleToggleThreadResolution(thread.id, !thread.isResolved)}
                  >
                    {thread.isResolved ? "Reabrir" : "Resolver"}
                  </Button>
                </div>
                <div className="space-y-2">
                  {thread.comments.map((comment) => (
                    <div key={comment.id} className="rounded bg-gray-50 px-2 py-1 text-sm dark:bg-gray-900/50">
                      <div className="text-xs text-gray-500">{comment.author?.name ?? "Usuario"}</div>
                      <div>{comment.body}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={commentDrafts[thread.id] ?? ""}
                    onChange={(event) =>
                      setCommentDrafts((prev) => ({ ...prev, [thread.id]: event.target.value }))
                    }
                    placeholder="Responder..."
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={isAddingComment || thread.isResolved || accessRole === "VIEWER"}
                    onClick={() => handleAddComment(thread.id)}
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            ))}
            {(commentThreads ?? []).length === 0 && (
              <p className="text-sm text-gray-500">No hay hilos de comentarios aún.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Sugerencias</h2>
          <div className="mb-3 flex gap-2">
            <Input
              value={suggestionDraft}
              onChange={(event) => setSuggestionDraft(event.target.value)}
              placeholder="Describe la sugerencia..."
            />
            <Button type="button" size="sm" disabled={isCreatingSuggestion || accessRole === "VIEWER"} onClick={handleCreateSuggestion}>
              Crear
            </Button>
          </div>
          <div className="max-h-[320px] space-y-2 overflow-y-auto">
            {(suggestions ?? []).map((suggestion) => (
              <div key={suggestion.id} className="rounded-md border border-gray-200 p-3 text-sm dark:border-gray-700">
                <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                  <span>{suggestion.type}</span>
                  <span>{suggestion.status}</span>
                </div>
                <p className="mb-2">{suggestion.note ?? "Sin detalle"}</p>
                {suggestion.status === "OPEN" && accessRole === "EDITOR" && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isResolvingSuggestion}
                      onClick={() => handleResolveSuggestionAction(suggestion.id, "ACCEPTED")}
                    >
                      Aceptar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isResolvingSuggestion}
                      onClick={() => handleResolveSuggestionAction(suggestion.id, "REJECTED")}
                    >
                      Rechazar
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {(suggestions ?? []).length === 0 && <p className="text-sm text-gray-500">No hay sugerencias aún.</p>}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Historial</h2>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <select
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              onChange={(event) => {
                const fromVersionId = event.target.value || undefined
                documentsLogger.debug({
                  event: "documentEditor:diff:selectFrom",
                  scope: "ui",
                  documentId,
                  versionId: fromVersionId,
                })
                setDiffSelection((prev) => ({ ...prev, fromVersionId }))
              }}
              value={diffSelection.fromVersionId ?? ""}
            >
              <option value="">Desde versión</option>
              {(versions ?? []).map((version) => (
                <option key={version.id} value={version.id}>
                  {version.source} - {format(new Date(version.createdAt), "dd MMM HH:mm")}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              onChange={(event) => {
                const toVersionId = event.target.value || undefined
                documentsLogger.debug({
                  event: "documentEditor:diff:selectTo",
                  scope: "ui",
                  documentId,
                  versionId: toVersionId,
                })
                setDiffSelection((prev) => ({ ...prev, toVersionId }))
              }}
              value={diffSelection.toVersionId ?? ""}
            >
              <option value="">Hasta versión</option>
              {(versions ?? []).map((version) => (
                <option key={version.id} value={version.id}>
                  {version.source} - {format(new Date(version.createdAt), "dd MMM HH:mm")}
                </option>
              ))}
            </select>
          </div>
          {selectedDiff && (
            <div className="mb-3 rounded-md bg-gray-50 p-2 text-xs text-gray-700 dark:bg-gray-900/50 dark:text-gray-300">
              Delta caracteres: {selectedDiff.summary.deltaLength}
              <div className="mt-1 max-h-[140px] overflow-y-auto">
                {selectedDiff.diff.slice(0, 10).map((item) => (
                  <div key={`${item.index}-${item.type}`}>[{item.type}] linea {item.index + 1}</div>
                ))}
              </div>
            </div>
          )}
          <div className="max-h-[220px] space-y-2 overflow-y-auto">
            {(versions ?? []).map((version) => (
              <div key={version.id} className="flex items-center justify-between rounded-md border border-gray-200 p-2 text-sm dark:border-gray-700">
                <div>
                  <div className="font-medium">{version.source}</div>
                  <div className="text-xs text-gray-500">{format(new Date(version.createdAt), "dd MMM yyyy HH:mm")}</div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isRestoringVersion || accessRole !== "EDITOR"}
                  onClick={() => handleRestoreVersionAction(version.id)}
                >
                  Restaurar
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Conversión DOCX</h2>
          <div className="mb-3 flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isCreatingConversionJob || accessRole !== "EDITOR"}
              onClick={() => importFileInputRef.current?.click()}
            >
              <FileUp className="h-4 w-4 sm:mr-1.5" />
              Usar adjunto para importar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!latestImportResultVersionId || isRestoringVersion || accessRole !== "EDITOR"}
              onClick={handleApplyLatestImport}
            >
              Aplicar ultima importacion
            </Button>
          </div>
          <div className="max-h-[260px] space-y-2 overflow-y-auto">
            {(conversionJobs ?? []).map((job) => (
              <div key={job.id} className="rounded-md border border-gray-200 p-2 text-sm dark:border-gray-700">
                <div className="font-medium">{job.type}</div>
                <div className="text-xs text-gray-500">Estado: {job.status}</div>
                {job.errorMessage && <div className="text-xs text-red-600">{job.errorMessage}</div>}
              </div>
            ))}
            {(conversionJobs ?? []).length === 0 && (
              <p className="text-sm text-gray-500">No hay trabajos de conversión aún.</p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("documents.assetsTitle")}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("documents.assetsDescription")}</p>
        </div>

        {isAssetsLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : (assets ?? []).length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {t("documents.noAssets")}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/60">
                  <TableHead>{t("documents.assetsTableFile")}</TableHead>
                  <TableHead>{t("documents.assetsTableSize")}</TableHead>
                  <TableHead>{t("documents.assetsTableUploaded")}</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets?.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">{asset.fileName}</TableCell>
                    <TableCell className="text-sm text-gray-500 dark:text-gray-400">{formatBytes(asset.size)}</TableCell>
                    <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(asset.createdAt), "dd MMM yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={t("documents.downloadAsset")}
                          onClick={() => handleDownload(asset.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={t("documents.deleteAsset")}
                          disabled={isDeletingAsset || accessRole !== "EDITOR"}
                          onClick={() => handleDeleteAsset(asset.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`
  const units = ["KB", "MB", "GB"]
  let size = value / 1024
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

