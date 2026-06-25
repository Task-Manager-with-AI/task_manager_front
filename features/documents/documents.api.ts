import { apiClient, ApiError } from "@/lib/api-client"
import { documentsLogger, toShortErrorMessage } from "./documents.logger"
import type {
  CommentEntry,
  CommentThread,
  ConversionJob,
  CreateDocumentDto,
  DocumentAsset,
  DocumentDiff,
  DocumentPermission,
  DocumentSuggestion,
  DocumentVersion,
  GeneratedDiagram,
  DiagramType,
  ProjectDocument,
  UpdateDocumentDto,
} from "./documents.types"

const BASE = "/api/v1"

function getExtension(fileName: string) {
  const parts = fileName.split(".")
  if (parts.length < 2) return "none"
  return parts[parts.length - 1]?.toLowerCase() ?? "none"
}

async function withApiLog<T>(
  operation: string,
  context: {
    projectId?: string
    documentId?: string
    threadId?: string
    suggestionId?: string
    versionId?: string
    assetId?: string
    jobId?: string
    count?: number
    sizeBytes?: number
    fileExtension?: string
    status?: string
  },
  action: () => Promise<T>
) {
  const startedAt = performance.now()
  documentsLogger.debug({
    event: `${operation}:request:start`,
    scope: "api",
    ...context,
  })

  try {
    const data = await action()
    documentsLogger.info({
      event: `${operation}:request:success`,
      scope: "api",
      durationMs: Math.round(performance.now() - startedAt),
      ...context,
    })
    return data
  } catch (error) {
    documentsLogger.error({
      event: `${operation}:request:error`,
      scope: "api",
      status: error instanceof ApiError ? error.status : undefined,
      errorCode: error instanceof ApiError ? error.status : undefined,
      message: toShortErrorMessage(error),
      durationMs: Math.round(performance.now() - startedAt),
      ...context,
    })
    throw error
  }
}

async function uploadAsset(documentId: string, file: File) {
  return withApiLog(
    "assets.upload",
    {
      documentId,
      sizeBytes: file.size,
      fileExtension: getExtension(file.name),
    },
    async () => {
      const form = new FormData()
      form.append("file", file, file.name)

      const res = await fetch(`${BASE}/documents/${documentId}/assets`, {
        method: "POST",
        credentials: "include",
        body: form,
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new ApiError(res.status, body.message ?? "Asset upload failed", body.errors)
      }
      return body.data
    }
  )
}

export const documentsApi = {
  listByProject: (projectId: string) =>
    withApiLog("documents.listByProject", { projectId }, () =>
      apiClient.get<ProjectDocument[]>(`/projects/${projectId}/documents`)
    ),
  create: (projectId: string, dto: CreateDocumentDto) =>
    withApiLog("documents.create", { projectId }, () =>
      apiClient.post<ProjectDocument>(`/projects/${projectId}/documents`, dto)
    ),
  createDiagram: (
    projectId: string,
    dto: {
      prompt: string
      diagram_type: DiagramType
      documentId?: string
      includeDocumentContext?: boolean
      title?: string
    }
  ) =>
    withApiLog("diagrams.create", { projectId, documentId: dto.documentId, status: dto.diagram_type }, async () =>
      normalizeDiagram(
        await apiClient.post<any>(`/projects/${projectId}/diagrams`, dto)
      )
    ),
  listProjectDiagrams: (projectId: string) =>
    withApiLog("diagrams.listByProject", { projectId }, async () =>
      normalizeDiagrams(
        await apiClient.get<any[]>(`/projects/${projectId}/diagrams`)
      )
    ),
  get: (documentId: string) =>
    withApiLog("documents.get", { documentId }, () =>
      apiClient.get<ProjectDocument>(`/documents/${documentId}`)
    ),
  listDocumentDiagrams: (documentId: string) =>
    withApiLog("diagrams.listByDocument", { documentId }, async () =>
      normalizeDiagrams(
        await apiClient.get<any[]>(`/documents/${documentId}/diagrams`)
      )
    ),
  update: (documentId: string, dto: UpdateDocumentDto) =>
    withApiLog("documents.update", { documentId }, () =>
      apiClient.patch<ProjectDocument>(`/documents/${documentId}`, dto)
    ),
  delete: (documentId: string) =>
    withApiLog("documents.delete", { documentId }, () =>
      apiClient.delete<null>(`/documents/${documentId}`)
    ),
  uploadAsset,
  listAssets: (documentId: string) =>
    withApiLog("assets.list", { documentId }, () =>
      apiClient.get<DocumentAsset[]>(`/documents/${documentId}/assets`)
    ),
  deleteAsset: (documentId: string, assetId: string) =>
    withApiLog("assets.delete", { documentId, assetId }, () =>
      apiClient.delete<null>(`/documents/${documentId}/assets/${assetId}`)
    ),
  listPermissions: (documentId: string) =>
    withApiLog("permissions.list", { documentId }, () =>
      apiClient.get<DocumentPermission[]>(`/documents/${documentId}/permissions`)
    ),
  setPermissions: (
    documentId: string,
    permissions: Array<{ userId: string; role: "VIEWER" | "COMMENTER" | "EDITOR" }>
  ) =>
    withApiLog("permissions.set", { documentId, count: permissions.length }, () =>
      apiClient.put<DocumentPermission[]>(`/documents/${documentId}/permissions`, { permissions })
    ),
  listCommentThreads: (documentId: string, includeResolved = false) =>
    withApiLog(
      "comments.threads.list",
      { documentId, status: includeResolved ? "all" : "open" },
      () =>
        apiClient.get<CommentThread[]>(
          `/documents/${documentId}/comments/threads?includeResolved=${includeResolved ? "true" : "false"}`
        )
    ),
  createCommentThread: (
    documentId: string,
    dto: {
      anchorFrom?: number
      anchorTo?: number
      quoteText?: string
      body: string
      mentions?: string[]
    }
  ) =>
    withApiLog("comments.thread.create", { documentId, count: dto.mentions?.length ?? 0 }, () =>
      apiClient.post<CommentThread>(`/documents/${documentId}/comments/threads`, dto)
    ),
  addComment: (
    documentId: string,
    threadId: string,
    dto: { body: string; mentions?: string[] }
  ) =>
    withApiLog("comments.add", { documentId, threadId, count: dto.mentions?.length ?? 0 }, () =>
      apiClient.post<CommentEntry>(
        `/documents/${documentId}/comments/threads/${threadId}/comments`,
        dto
      )
    ),
  resolveThread: (documentId: string, threadId: string) =>
    withApiLog("comments.thread.resolve", { documentId, threadId }, () =>
      apiClient.post<CommentThread>(`/documents/${documentId}/comments/threads/${threadId}/resolve`)
    ),
  reopenThread: (documentId: string, threadId: string) =>
    withApiLog("comments.thread.reopen", { documentId, threadId }, () =>
      apiClient.post<CommentThread>(`/documents/${documentId}/comments/threads/${threadId}/reopen`)
    ),
  listSuggestions: (documentId: string, status?: "OPEN" | "ACCEPTED" | "REJECTED") =>
    withApiLog("suggestions.list", { documentId, status: status ?? "all" }, () =>
      apiClient.get<DocumentSuggestion[]>(
        `/documents/${documentId}/suggestions${status ? `?status=${status}` : ""}`
      )
    ),
  createSuggestion: (
    documentId: string,
    dto: {
      type: "INSERT" | "DELETE" | "FORMAT" | "REPLACE"
      anchorFrom?: number
      anchorTo?: number
      note?: string
      payload?: Record<string, unknown>
    }
  ) =>
    withApiLog("suggestions.create", { documentId, status: dto.type }, () =>
      apiClient.post<DocumentSuggestion>(`/documents/${documentId}/suggestions`, dto)
    ),
  resolveSuggestion: (
    documentId: string,
    suggestionId: string,
    status: "ACCEPTED" | "REJECTED"
  ) =>
    withApiLog("suggestions.resolve", { documentId, suggestionId, status }, () =>
      apiClient.post<DocumentSuggestion>(
        `/documents/${documentId}/suggestions/${suggestionId}/resolve`,
        { status }
      )
    ),
  listVersions: (documentId: string, take = 20) =>
    withApiLog("versions.list", { documentId, count: take }, () =>
      apiClient.get<DocumentVersion[]>(`/documents/${documentId}/versions?take=${take}`)
    ),
  createVersion: (
    documentId: string,
    dto: { source?: string; metadata?: Record<string, unknown> } = {}
  ) =>
    withApiLog("versions.create", { documentId, status: dto.source ?? "snapshot" }, () =>
      apiClient.post<DocumentVersion>(`/documents/${documentId}/versions`, dto)
    ),
  getVersionDiff: (documentId: string, fromVersionId: string, toVersionId: string) =>
    withApiLog(
      "versions.diff",
      { documentId, versionId: `${fromVersionId}->${toVersionId}` },
      () =>
        apiClient.get<DocumentDiff>(
          `/documents/${documentId}/versions/diff?fromVersionId=${fromVersionId}&toVersionId=${toVersionId}`
        )
    ),
  restoreVersion: (documentId: string, versionId: string, source = "restore") =>
    withApiLog("versions.restore", { documentId, versionId, status: source }, () =>
      apiClient.post<DocumentVersion>(`/documents/${documentId}/versions/${versionId}/restore`, {
        source,
      })
    ),
  listConversionJobs: (documentId: string) =>
    withApiLog("conversionJobs.list", { documentId }, () =>
      apiClient.get<ConversionJob[]>(`/documents/${documentId}/conversion-jobs`)
    ),
  createConversionJob: (
    documentId: string,
    dto: {
      type: "IMPORT_DOCX" | "EXPORT_DOCX"
      inputAssetId?: string
      sourceVersionId?: string
      requestedFileName?: string
    }
  ) =>
    withApiLog("conversionJobs.create", { documentId, status: dto.type }, () =>
      apiClient.post<ConversionJob>(`/documents/${documentId}/conversion-jobs`, dto)
    ),
  getConversionJob: (documentId: string, jobId: string) =>
    withApiLog("conversionJobs.get", { documentId, jobId }, () =>
      apiClient.get<ConversionJob>(`/documents/${documentId}/conversion-jobs/${jobId}`)
    ),
  cancelConversionJob: (documentId: string, jobId: string) =>
    withApiLog("conversionJobs.cancel", { documentId, jobId }, () =>
      apiClient.post<{ id: string; status: string }>(
        `/documents/${documentId}/conversion-jobs/${jobId}/cancel`
      )
    ),
  assetDownloadUrl: (documentId: string, assetId: string) => {
    documentsLogger.debug({
      event: "assets.downloadUrl:request",
      scope: "api",
      documentId,
      assetId,
    })
    return `${BASE}/documents/${documentId}/assets/${assetId}`
  },
}

function normalizeDiagrams(diagrams: any[]): GeneratedDiagram[] {
  return diagrams.map(normalizeDiagram)
}

function normalizeDiagram(diagram: any): GeneratedDiagram {
  return {
    id: diagram.id,
    projectId: diagram.projectId,
    documentId: diagram.documentId ?? null,
    title: diagram.title,
    diagramType: diagram.diagramType,
    prompt: diagram.prompt ?? null,
    url: diagram.publicUrl ?? diagram.url,
    createdAt: diagram.createdAt,
    updatedAt: diagram.updatedAt,
    createdById: diagram.createdById,
    createdBy: diagram.createdBy,
    document: diagram.document ?? null,
  }
}
