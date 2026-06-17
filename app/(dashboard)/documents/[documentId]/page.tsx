"use client"

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ChevronLeft, ChevronRight, Download, FileCog, FileUp, MessageSquarePlus, Paperclip, Save, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  useDocumentDiagrams,
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
import type { DocumentDiff, DocumentOutlineHeading, DocumentPermissionRole, DocumentVersion } from "@/features/documents/documents.types"
import { OutlineSidebar } from "@/features/documents/components/OutlineSidebar"
import { RightPanel } from "@/features/documents/components/RightPanel"
import { TopNavbar } from "@/features/documents/components/TopNavbar"
import { ShareDocumentModal } from "@/features/documents/components/ShareDocumentModal"
import { FloatingChat } from "@/features/documents/components/FloatingChat"

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
  const { data: diagrams } = useDocumentDiagrams(documentId)
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
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>()
  const [compareAgainstVersionId, setCompareAgainstVersionId] = useState<string | undefined>()
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isOutlineOpen, setIsOutlineOpen] = useState(true)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true)
  const [activeUsers, setActiveUsers] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [headings, setHeadings] = useState<DocumentOutlineHeading[]>([])
  const proEditorRef = useRef<{ scrollToPos: (pos: number) => void } | null>(null)
  const editorScrollContainerRef = useRef<HTMLElement | null>(null)

  const { data: selectedDiff } = useVersionDiff(
    documentId,
    diffSelection.fromVersionId,
    diffSelection.toVersionId
  )

  const selectedVersion = useMemo(
    () => (versions ?? []).find((version) => version.id === selectedVersionId),
    [selectedVersionId, versions]
  )

  const comparisonCandidates = useMemo(
    () => (versions ?? []).filter((version) => version.id !== selectedVersionId),
    [selectedVersionId, versions]
  )

  const historyComparison = useMemo(() => {
    if (!selectedVersion || !compareAgainstVersionId || !versions?.length) return null

    const compareAgainst = versions.find((version) => version.id === compareAgainstVersionId)
    if (!compareAgainst) return null

    return {
      fromVersionId: compareAgainst.id,
      toVersionId: selectedVersion.id,
      baseVersion: compareAgainst,
      targetVersion: selectedVersion,
      label: "Comparación personalizada entre versiones",
    }

    /*
      return {
        fromVersionId: selected.id,
        toVersionId: latest.id,
        baseVersion: selected,
        targetVersion: latest,
        label: "Comparado con la versión más reciente",
      }
    }

    const previous = versions[1]
    if (!previous) return null

    return {
      fromVersionId: previous.id,
      toVersionId: selected.id,
      baseVersion: previous,
      targetVersion: selected,
      label: "Cambios respecto a la versión anterior",
    }
    */
  }, [compareAgainstVersionId, selectedVersion, versions])

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

  useEffect(() => {
    if (!historyComparison) {
      setDiffSelection({})
      return
    }

    setDiffSelection((current) => {
      if (
        current.fromVersionId === historyComparison.fromVersionId &&
        current.toVersionId === historyComparison.toVersionId
      ) {
        return current
      }

      return {
        fromVersionId: historyComparison.fromVersionId,
        toVersionId: historyComparison.toVersionId,
      }
    })
  }, [historyComparison])

  useEffect(() => {
    if (!selectedVersionId || !versions?.length) {
      setCompareAgainstVersionId(undefined)
      return
    }

    const selected = versions.find((version) => version.id === selectedVersionId)
    if (!selected) {
      setCompareAgainstVersionId(undefined)
      return
    }

    const isStillValid = versions.some(
      (version) => version.id === compareAgainstVersionId && version.id !== selected.id
    )

    if (isStillValid) return

    const fallback =
      (selected.id === versions[0]?.id ? versions[1] : versions[0]) ??
      versions.find((version) => version.id !== selected.id)

    setCompareAgainstVersionId(fallback?.id)
  }, [compareAgainstVersionId, selectedVersionId, versions])

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
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Skeleton className="h-14 w-full mb-4" />
        <Skeleton className="h-[70vh] w-full max-w-4xl" />
      </div>
    )
  }

  const isHistoryMode = !!selectedVersionId;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      <TopNavbar
        projectId={document.projectId}
        title={title}
        originalTitle={document.title}
        setTitle={setTitle}
        handleRename={handleRename}
        isSaving={isSaving}
        handleCreateSnapshot={handleCreateSnapshot}
        isCreatingVersion={isCreatingVersion}
        handleExportDocx={handleExportDocx}
        isCreatingConversionJob={isCreatingConversionJob}
        latestVersionId={latestVersionId}
        importFileInputRef={importFileInputRef}
        handleImportDocx={handleImportDocx}
        fileInputRef={fileInputRef}
        handleUpload={handleUpload}
        isUploading={isUploading}
        onShareClick={() => setIsShareModalOpen(true)}
        isHistoryMode={isHistoryMode}
        activeUsers={activeUsers}
        onExitHistory={() => {
          setSelectedVersionId(undefined)
          setCompareAgainstVersionId(undefined)
        }}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {!isHistoryMode && (
          <div className="relative flex h-full items-stretch">
            <div
              className={`overflow-hidden transition-[width,opacity] duration-300 ease-out ${
                isOutlineOpen ? "w-64 opacity-100" : "w-0 opacity-0"
              }`}
            >
              <OutlineSidebar
                headings={headings}
                onHeadingClick={(pos) => proEditorRef.current?.scrollToPos(pos)}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsOutlineOpen((current) => !current)}
              className="absolute right-0 top-1/2 z-20 h-10 w-10 translate-x-1/2 -translate-y-1/2 rounded-full border-gray-300 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900"
              title={isOutlineOpen ? "Ocultar esquema" : "Mostrar esquema"}
            >
              {isOutlineOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        <main
          ref={editorScrollContainerRef}
          data-document-scroll-container="true"
          className={`flex-1 overflow-y-auto ${isHistoryMode ? "bg-[#FFFDE7] dark:bg-[#3E3C2A]" : "bg-gray-100 dark:bg-gray-950"}`}
        >
          <div className="mx-auto max-w-4xl p-6 lg:p-12">
            {actionError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {actionError}
              </div>
            )}
            <div className={`overflow-hidden rounded-sm ${isHistoryMode ? "opacity-90 grayscale-[0.2]" : ""}`}>
              {isHistoryMode ? (
                <HistoryVersionPreview
                  selectedVersion={selectedVersion}
                  compareAgainstVersionId={compareAgainstVersionId}
                  comparisonCandidates={comparisonCandidates}
                  comparison={historyComparison}
                  diff={selectedDiff}
                  onCompareAgainstChange={setCompareAgainstVersionId}
                />
              ) : (
                <>
                  {useProEditor ? (
                    <ProCollaborativeEditor
                      projectId={document.projectId}
                      documentId={documentId}
                      user={editorUser}
                      accessRole={accessRole}
                      onTrackChange={handleTrackedChange}
                      onActiveUsersChange={setActiveUsers}
                      onOutlineChange={setHeadings}
                      editorRef={proEditorRef}
                      scrollContainerRef={editorScrollContainerRef}
                    />
                  ) : (
                    <CollaborativeEditor 
                      documentId={documentId} 
                      user={editorUser} 
                      onActiveUsersChange={setActiveUsers}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </main>

        <div className="relative flex h-full items-stretch">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsRightPanelOpen((current) => !current)}
            className={`absolute left-0 top-1/2 z-20 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-gray-300 bg-white shadow-md transition-transform dark:border-gray-700 dark:bg-gray-900 ${
              isRightPanelOpen ? "" : "translate-x-0"
            }`}
            title={isRightPanelOpen ? "Ocultar panel lateral" : "Mostrar panel lateral"}
          >
            {isRightPanelOpen ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          <div
            className={`overflow-hidden transition-[width,opacity] duration-300 ease-out ${
              isRightPanelOpen ? "w-80 opacity-100" : "w-0 opacity-0"
            }`}
          >
            <RightPanel
              accessRole={accessRole}
              commentThreads={commentThreads ?? []}
              isCreatingThread={isCreatingThread}
              isResolvingThread={isResolvingThread}
              isAddingComment={isAddingComment}
              handleCreateThread={handleCreateThread}
              handleToggleThreadResolution={handleToggleThreadResolution}
              handleAddComment={handleAddComment}
              versions={versions ?? []}
              handleRestoreVersionAction={handleRestoreVersionAction}
              isRestoringVersion={isRestoringVersion}
              selectedVersionId={selectedVersionId}
              onSelectVersion={setSelectedVersionId}
              diagrams={diagrams ?? []}
            />
          </div>
        </div>
      </div>
      <ShareDocumentModal
        documentId={documentId}
        isOpen={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        owner={document?.createdBy}
      />
      <FloatingChat currentUser={{ id: currentUser.id, name: currentUser.name }} />
    </div>
  )
}

function HistoryVersionPreview({
  selectedVersion,
  compareAgainstVersionId,
  comparisonCandidates,
  comparison,
  diff,
  onCompareAgainstChange,
}: {
  selectedVersion?: DocumentVersion
  compareAgainstVersionId?: string
  comparisonCandidates: DocumentVersion[]
  comparison: {
    fromVersionId: string
    toVersionId: string
    baseVersion: DocumentVersion
    targetVersion: DocumentVersion
    label: string
  } | null
  diff?: DocumentDiff
  onCompareAgainstChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col bg-transparent">
      <div className="border-b border-amber-200 bg-amber-50 px-5 py-4 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
          Modo Historial
        </div>
        <div className="mt-1 text-lg font-semibold">
          {selectedVersion
            ? `Versión del ${format(new Date(selectedVersion.createdAt), "dd MMM yyyy, HH:mm")}`
            : "Versión no encontrada"}
        </div>
        <div className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">
          {comparison?.label ?? "Selecciona otra versión para ver una comparación."}
        </div>
        {comparisonCandidates.length > 0 && (
          <div className="mt-4 flex max-w-md flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
              Comparar contra
            </label>
            <Select value={compareAgainstVersionId} onValueChange={onCompareAgainstChange}>
              <SelectTrigger className="border-amber-300 bg-white/90 text-slate-900 dark:border-amber-800 dark:bg-slate-950 dark:text-slate-100">
                <SelectValue placeholder="Selecciona una versión base" />
              </SelectTrigger>
              <SelectContent>
                {comparisonCandidates.map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    {formatVersionChip(version)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="document-page-workspace">
        <div className="mx-auto w-[816px] max-w-full border border-slate-200 bg-white px-16 py-12 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950">
          <article className="prose prose-slate max-w-none whitespace-pre-wrap break-words text-[15px] leading-7 dark:prose-invert">
            {selectedVersion?.plainText?.trim() ? (
              selectedVersion.plainText
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                Esta versión no tiene texto plano guardado todavía.
              </span>
            )}
          </article>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto max-w-4xl px-6 py-5 lg:px-12">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Base: {comparison ? formatVersionChip(comparison.baseVersion) : "N/A"}
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-950/70 dark:text-blue-200">
              Comparada con: {comparison ? formatVersionChip(comparison.targetVersion) : "N/A"}
            </span>
          </div>

          {diff ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <DiffSummaryCard
                  label="Texto origen"
                  value={`${diff.summary.fromLength} chars`}
                />
                <DiffSummaryCard
                  label="Texto destino"
                  value={`${diff.summary.toLength} chars`}
                />
                <DiffSummaryCard
                  label="Diferencia"
                  value={formatDelta(diff.summary.deltaLength)}
                  accent={diff.summary.deltaLength >= 0 ? "positive" : "negative"}
                />
              </div>

              <ScrollArea className="mt-4 h-[280px] rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {diff.diff.length > 0 ? (
                    diff.diff.map((entry, index) => (
                      <div key={`${entry.index}-${index}`} className="p-4">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {labelForDiffEntry(entry.type)} en índice {entry.index}
                        </div>
                        {"from" in entry && entry.from !== undefined && (
                          <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                            <span className="mr-2 text-xs font-semibold uppercase">Antes</span>
                            {entry.from || "(vacío)"}
                          </div>
                        )}
                        {"to" in entry && entry.to !== undefined && (
                          <div className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                            <span className="mr-2 text-xs font-semibold uppercase">Después</span>
                            {entry.to || "(vacío)"}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-slate-500 dark:text-slate-400">
                      No se encontraron diferencias entre estas versiones.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No hay comparación disponible para esta versión todavía.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DiffSummaryCard({
  label,
  value,
  accent = "neutral",
}: {
  label: string
  value: string
  accent?: "neutral" | "positive" | "negative"
}) {
  const accentClass =
    accent === "positive"
      ? "text-emerald-700 dark:text-emerald-300"
      : accent === "negative"
        ? "text-rose-700 dark:text-rose-300"
        : "text-slate-900 dark:text-slate-100"

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className={`mt-2 text-lg font-semibold ${accentClass}`}>{value}</div>
    </div>
  )
}

function labelForDiffEntry(type: DocumentDiff["diff"][number]["type"]) {
  if (type === "added") return "Agregado"
  if (type === "removed") return "Eliminado"
  return "Modificado"
}

function formatVersionChip(version: DocumentVersion) {
  const author = version.createdBy?.name ?? "Sistema"
  return `${format(new Date(version.createdAt), "dd MMM HH:mm")} · ${author}`
}

function formatDelta(value: number) {
  if (value === 0) return "0 chars"
  return `${value > 0 ? "+" : ""}${value} chars`
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

