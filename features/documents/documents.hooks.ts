"use client"

import { useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { documentsApi } from "./documents.api"
import { documentsLogger, toShortErrorMessage } from "./documents.logger"
import type {
  ConversionJob,
  CreateDocumentDto,
  DiagramType,
  UpdateDocumentDto,
} from "./documents.types"

export function useProjectDocuments(projectId: string) {
  return useQuery({
    queryKey: ["documents", projectId],
    queryFn: async () => {
      documentsLogger.debug({
        event: "projectDocuments:query:fetch",
        scope: "hook",
        projectId,
      })
      try {
        const data = await documentsApi.listByProject(projectId)
        documentsLogger.info({
          event: "projectDocuments:query:success",
          scope: "hook",
          projectId,
          count: data.length,
        })
        return data
      } catch (error) {
        documentsLogger.error({
          event: "projectDocuments:query:error",
          scope: "hook",
          projectId,
          message: toShortErrorMessage(error),
        })
        throw error
      }
    },
    enabled: Boolean(projectId),
  })
}

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: ["document", documentId],
    queryFn: async () => {
      documentsLogger.debug({
        event: "document:query:fetch",
        scope: "hook",
        documentId,
      })
      try {
        const data = await documentsApi.get(documentId)
        documentsLogger.info({
          event: "document:query:success",
          scope: "hook",
          documentId,
        })
        return data
      } catch (error) {
        documentsLogger.error({
          event: "document:query:error",
          scope: "hook",
          documentId,
          message: toShortErrorMessage(error),
        })
        throw error
      }
    },
    enabled: Boolean(documentId),
  })
}

export function useProjectDiagrams(projectId: string) {
  return useQuery({
    queryKey: ["project-diagrams", projectId],
    queryFn: async () => {
      documentsLogger.debug({
        event: "projectDiagrams:query:fetch",
        scope: "hook",
        projectId,
      })
      try {
        const data = await documentsApi.listProjectDiagrams(projectId)
        documentsLogger.info({
          event: "projectDiagrams:query:success",
          scope: "hook",
          projectId,
          count: data.length,
        })
        return data
      } catch (error) {
        documentsLogger.error({
          event: "projectDiagrams:query:error",
          scope: "hook",
          projectId,
          message: toShortErrorMessage(error),
        })
        throw error
      }
    },
    enabled: Boolean(projectId),
  })
}

export function useDocumentDiagrams(documentId: string) {
  return useQuery({
    queryKey: ["document-diagrams", documentId],
    queryFn: async () => {
      documentsLogger.debug({
        event: "documentDiagrams:query:fetch",
        scope: "hook",
        documentId,
      })
      try {
        const data = await documentsApi.listDocumentDiagrams(documentId)
        documentsLogger.info({
          event: "documentDiagrams:query:success",
          scope: "hook",
          documentId,
          count: data.length,
        })
        return data
      } catch (error) {
        documentsLogger.error({
          event: "documentDiagrams:query:error",
          scope: "hook",
          documentId,
          message: toShortErrorMessage(error),
        })
        throw error
      }
    },
    enabled: Boolean(documentId),
  })
}

export function useCreateDocument(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: CreateDocumentDto) => {
      documentsLogger.debug({
        event: "document:create:mutation:start",
        scope: "hook",
        projectId,
      })
      return documentsApi.create(projectId, dto)
    },
    onSuccess: (document) => {
      documentsLogger.info({
        event: "document:create:mutation:success",
        scope: "hook",
        projectId,
        documentId: document.id,
      })
      queryClient.invalidateQueries({ queryKey: ["documents", projectId] })
    },
    onError: (error) => {
      documentsLogger.error({
        event: "document:create:mutation:error",
        scope: "hook",
        projectId,
        message: toShortErrorMessage(error),
      })
    },
  })
}

export function useCreateDiagram(projectId: string, documentId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: {
      prompt: string
      diagram_type: DiagramType
      includeDocumentContext?: boolean
      title?: string
    }) => {
      documentsLogger.debug({
        event: "diagram:create:mutation:start",
        scope: "hook",
        projectId,
        documentId,
        status: dto.diagram_type,
      })
      return documentsApi.createDiagram(projectId, {
        ...dto,
        documentId,
      })
    },
    onSuccess: (diagram) => {
      documentsLogger.info({
        event: "diagram:create:mutation:success",
        scope: "hook",
        projectId,
        documentId: diagram.documentId ?? documentId,
        status: diagram.diagramType,
      })
      queryClient.invalidateQueries({ queryKey: ["project-diagrams", projectId] })
      if (diagram.documentId ?? documentId) {
        queryClient.invalidateQueries({
          queryKey: ["document-diagrams", diagram.documentId ?? documentId],
        })
      }
    },
    onError: (error) => {
      documentsLogger.error({
        event: "diagram:create:mutation:error",
        scope: "hook",
        projectId,
        documentId,
        message: toShortErrorMessage(error),
      })
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ documentId, dto }: { documentId: string; dto: UpdateDocumentDto }) => {
      documentsLogger.debug({
        event: "document:update:mutation:start",
        scope: "hook",
        documentId,
      })
      return documentsApi.update(documentId, dto)
    },
    onSuccess: (document) => {
      documentsLogger.info({
        event: "document:update:mutation:success",
        scope: "hook",
        documentId: document.id,
        projectId: document.projectId,
      })
      queryClient.invalidateQueries({ queryKey: ["document", document.id] })
      queryClient.invalidateQueries({ queryKey: ["documents", document.projectId] })
    },
    onError: (error, variables) => {
      documentsLogger.error({
        event: "document:update:mutation:error",
        scope: "hook",
        documentId: variables.documentId,
        message: toShortErrorMessage(error),
      })
    },
  })
}

export function useDeleteDocument(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (documentId: string) => {
      documentsLogger.debug({
        event: "document:delete:mutation:start",
        scope: "hook",
        projectId,
        documentId,
      })
      return documentsApi.delete(documentId)
    },
    onSuccess: (_data, documentId) => {
      documentsLogger.info({
        event: "document:delete:mutation:success",
        scope: "hook",
        projectId,
        documentId,
      })
      queryClient.invalidateQueries({ queryKey: ["documents", projectId] })
    },
    onError: (error, documentId) => {
      documentsLogger.error({
        event: "document:delete:mutation:error",
        scope: "hook",
        projectId,
        documentId,
        message: toShortErrorMessage(error),
      })
    },
  })
}

export function useUploadDocumentAsset(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      documentsLogger.debug({
        event: "asset:upload:mutation:start",
        scope: "hook",
        documentId,
        sizeBytes: file.size,
      })
      return documentsApi.uploadAsset(documentId, file)
    },
    onSuccess: (asset) => {
      documentsLogger.info({
        event: "asset:upload:mutation:success",
        scope: "hook",
        documentId,
        assetId: asset.id,
      })
      queryClient.invalidateQueries({ queryKey: ["document-assets", documentId] })
    },
    onError: (error) => {
      documentsLogger.error({
        event: "asset:upload:mutation:error",
        scope: "hook",
        documentId,
        message: toShortErrorMessage(error),
      })
    },
  })
}

export function useDocumentAssets(documentId: string) {
  return useQuery({
    queryKey: ["document-assets", documentId],
    queryFn: async () => {
      documentsLogger.debug({
        event: "assets:query:fetch",
        scope: "hook",
        documentId,
      })
      try {
        const data = await documentsApi.listAssets(documentId)
        documentsLogger.info({
          event: "assets:query:success",
          scope: "hook",
          documentId,
          count: data.length,
        })
        return data
      } catch (error) {
        documentsLogger.error({
          event: "assets:query:error",
          scope: "hook",
          documentId,
          message: toShortErrorMessage(error),
        })
        throw error
      }
    },
    enabled: Boolean(documentId),
  })
}

export function useDeleteDocumentAsset(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assetId: string) => {
      documentsLogger.debug({
        event: "asset:delete:mutation:start",
        scope: "hook",
        documentId,
        assetId,
      })
      return documentsApi.deleteAsset(documentId, assetId)
    },
    onSuccess: (_data, assetId) => {
      documentsLogger.info({
        event: "asset:delete:mutation:success",
        scope: "hook",
        documentId,
        assetId,
      })
      queryClient.invalidateQueries({ queryKey: ["document-assets", documentId] })
    },
    onError: (error, assetId) => {
      documentsLogger.error({
        event: "asset:delete:mutation:error",
        scope: "hook",
        documentId,
        assetId,
        message: toShortErrorMessage(error),
      })
    },
  })
}

export function useDocumentPermissions(documentId: string) {
  return useQuery({
    queryKey: ["document-permissions", documentId],
    queryFn: async () => {
      documentsLogger.debug({
        event: "permissions:query:fetch",
        scope: "hook",
        documentId,
      })
      try {
        const data = await documentsApi.listPermissions(documentId)
        documentsLogger.info({
          event: "permissions:query:success",
          scope: "hook",
          documentId,
          count: data.length,
        })
        return data
      } catch (error) {
        documentsLogger.error({
          event: "permissions:query:error",
          scope: "hook",
          documentId,
          message: toShortErrorMessage(error),
        })
        throw error
      }
    },
    enabled: Boolean(documentId),
  })
}

export function useSetDocumentPermissions(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      permissions: Array<{ userId: string; role: "VIEWER" | "COMMENTER" | "EDITOR" }>
    ) => {
      documentsLogger.debug({
        event: "permissions:set:mutation:start",
        scope: "hook",
        documentId,
        count: permissions.length,
      })
      return documentsApi.setPermissions(documentId, permissions)
    },
    onSuccess: (permissions) => {
      documentsLogger.info({
        event: "permissions:set:mutation:success",
        scope: "hook",
        documentId,
        count: permissions.length,
      })
      queryClient.invalidateQueries({ queryKey: ["document-permissions", documentId] })
      queryClient.invalidateQueries({ queryKey: ["document", documentId] })
    },
    onError: (error) => {
      documentsLogger.error({
        event: "permissions:set:mutation:error",
        scope: "hook",
        documentId,
        message: toShortErrorMessage(error),
      })
    },
  })
}

export function useCommentThreads(documentId: string, includeResolved = true) {
  return useQuery({
    queryKey: ["document-comment-threads", documentId, includeResolved],
    queryFn: async () => {
      documentsLogger.debug({
        event: "commentThreads:query:fetch",
        scope: "hook",
        documentId,
        status: includeResolved ? "all" : "open",
      })
      try {
        const data = await documentsApi.listCommentThreads(documentId, includeResolved)
        documentsLogger.info({
          event: "commentThreads:query:success",
          scope: "hook",
          documentId,
          count: data.length,
        })
        return data
      } catch (error) {
        documentsLogger.error({
          event: "commentThreads:query:error",
          scope: "hook",
          documentId,
          message: toShortErrorMessage(error),
        })
        throw error
      }
    },
    enabled: Boolean(documentId),
  })
}

export function useCreateCommentThread(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: {
      anchorFrom?: number
      anchorTo?: number
      quoteText?: string
      body: string
      mentions?: string[]
    }) => {
      documentsLogger.debug({
        event: "commentThread:create:mutation:start",
        scope: "hook",
        documentId,
        count: dto.mentions?.length ?? 0,
      })
      return documentsApi.createCommentThread(documentId, dto)
    },
    onSuccess: (thread) => {
      documentsLogger.info({
        event: "commentThread:create:mutation:success",
        scope: "hook",
        documentId,
        threadId: thread.id,
      })
      queryClient.invalidateQueries({ queryKey: ["document-comment-threads", documentId] })
    },
    onError: (error) => {
      documentsLogger.error({
        event: "commentThread:create:mutation:error",
        scope: "hook",
        documentId,
        message: toShortErrorMessage(error),
      })
    },
  })
}

export function useAddComment(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      threadId,
      body,
      mentions,
    }: {
      threadId: string
      body: string
      mentions?: string[]
    }) => {
      documentsLogger.debug({
        event: "comment:add:mutation:start",
        scope: "hook",
        documentId,
        threadId,
        count: mentions?.length ?? 0,
      })
      return documentsApi.addComment(documentId, threadId, { body, mentions })
    },
    onSuccess: (comment) => {
      documentsLogger.info({
        event: "comment:add:mutation:success",
        scope: "hook",
        documentId,
        threadId: comment.threadId,
      })
      queryClient.invalidateQueries({ queryKey: ["document-comment-threads", documentId] })
    },
    onError: (error, variables) => {
      documentsLogger.error({
        event: "comment:add:mutation:error",
        scope: "hook",
        documentId,
        threadId: variables.threadId,
        message: toShortErrorMessage(error),
      })
    },
  })
}

export function useResolveThread(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ threadId, resolved }: { threadId: string; resolved: boolean }) => {
      documentsLogger.debug({
        event: "commentThread:resolve:mutation:start",
        scope: "hook",
        documentId,
        threadId,
        status: resolved ? "resolve" : "reopen",
      })
      return resolved
        ? documentsApi.resolveThread(documentId, threadId)
        : documentsApi.reopenThread(documentId, threadId)
    },
    onSuccess: (thread) => {
      documentsLogger.info({
        event: "commentThread:resolve:mutation:success",
        scope: "hook",
        documentId,
        threadId: thread.id,
        status: thread.isResolved ? "resolved" : "reopened",
      })
      queryClient.invalidateQueries({ queryKey: ["document-comment-threads", documentId] })
    },
    onError: (error, variables) => {
      documentsLogger.error({
        event: "commentThread:resolve:mutation:error",
        scope: "hook",
        documentId,
        threadId: variables.threadId,
        message: toShortErrorMessage(error),
      })
    },
  })
}

export function useSuggestions(documentId: string, status?: "OPEN" | "ACCEPTED" | "REJECTED") {
  return useQuery({
    queryKey: ["document-suggestions", documentId, status],
    queryFn: async () => {
      documentsLogger.debug({
        event: "suggestions:query:fetch",
        scope: "hook",
        documentId,
        status: status ?? "all",
      })
      try {
        const data = await documentsApi.listSuggestions(documentId, status)
        documentsLogger.info({
          event: "suggestions:query:success",
          scope: "hook",
          documentId,
          count: data.length,
        })
        return data
      } catch (error) {
        documentsLogger.error({
          event: "suggestions:query:error",
          scope: "hook",
          documentId,
          message: toShortErrorMessage(error),
        })
        throw error
      }
    },
    enabled: Boolean(documentId),
  })
}

export function useCreateSuggestion(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: {
      type: "INSERT" | "DELETE" | "FORMAT" | "REPLACE"
      anchorFrom?: number
      anchorTo?: number
      note?: string
      payload?: Record<string, unknown>
    }) => {
      documentsLogger.debug({
        event: "suggestion:create:mutation:start",
        scope: "hook",
        documentId,
        status: dto.type,
      })
      return documentsApi.createSuggestion(documentId, dto)
    },
    onSuccess: (suggestion) => {
      documentsLogger.info({
        event: "suggestion:create:mutation:success",
        scope: "hook",
        documentId,
        suggestionId: suggestion.id,
      })
      queryClient.invalidateQueries({ queryKey: ["document-suggestions", documentId] })
    },
    onError: (error) => {
      documentsLogger.error({
        event: "suggestion:create:mutation:error",
        scope: "hook",
        documentId,
        message: toShortErrorMessage(error),
      })
    },
  })
}

export function useResolveSuggestion(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      suggestionId,
      status,
    }: {
      suggestionId: string
      status: "ACCEPTED" | "REJECTED"
    }) => {
      documentsLogger.debug({
        event: "suggestion:resolve:mutation:start",
        scope: "hook",
        documentId,
        suggestionId,
        status,
      })
      return documentsApi.resolveSuggestion(documentId, suggestionId, status)
    },
    onSuccess: (suggestion) => {
      documentsLogger.info({
        event: "suggestion:resolve:mutation:success",
        scope: "hook",
        documentId,
        suggestionId: suggestion.id,
        status: suggestion.status,
      })
      queryClient.invalidateQueries({ queryKey: ["document-suggestions", documentId] })
    },
    onError: (error, variables) => {
      documentsLogger.error({
        event: "suggestion:resolve:mutation:error",
        scope: "hook",
        documentId,
        suggestionId: variables.suggestionId,
        message: toShortErrorMessage(error),
      })
    },
  })
}

export function useDocumentVersions(documentId: string, take = 20) {
  return useQuery({
    queryKey: ["document-versions", documentId, take],
    queryFn: async () => {
      documentsLogger.debug({
        event: "versions:query:fetch",
        scope: "hook",
        documentId,
        count: take,
      })
      try {
        const data = await documentsApi.listVersions(documentId, take)
        documentsLogger.info({
          event: "versions:query:success",
          scope: "hook",
          documentId,
          count: data.length,
        })
        return data
      } catch (error) {
        documentsLogger.error({
          event: "versions:query:error",
          scope: "hook",
          documentId,
          message: toShortErrorMessage(error),
        })
        throw error
      }
    },
    enabled: Boolean(documentId),
  })
}

export function useCreateDocumentVersion(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: { source?: string; metadata?: Record<string, unknown> } = {}) => {
      documentsLogger.debug({
        event: "version:create:mutation:start",
        scope: "hook",
        documentId,
        status: dto.source ?? "snapshot",
      })
      return documentsApi.createVersion(documentId, dto)
    },
    onSuccess: (version) => {
      documentsLogger.info({
        event: "version:create:mutation:success",
        scope: "hook",
        documentId,
        versionId: version.id,
      })
      queryClient.invalidateQueries({ queryKey: ["document-versions", documentId] })
    },
    onError: (error) => {
      documentsLogger.error({
        event: "version:create:mutation:error",
        scope: "hook",
        documentId,
        message: toShortErrorMessage(error),
      })
    },
  })
}

export function useVersionDiff(documentId: string, fromVersionId?: string, toVersionId?: string) {
  return useQuery({
    queryKey: ["document-version-diff", documentId, fromVersionId, toVersionId],
    queryFn: async () => {
      documentsLogger.debug({
        event: "versionDiff:query:fetch",
        scope: "hook",
        documentId,
        versionId: `${fromVersionId}->${toVersionId}`,
      })
      try {
        const data = await documentsApi.getVersionDiff(documentId, fromVersionId!, toVersionId!)
        documentsLogger.info({
          event: "versionDiff:query:success",
          scope: "hook",
          documentId,
          count: data.diff.length,
        })
        return data
      } catch (error) {
        documentsLogger.error({
          event: "versionDiff:query:error",
          scope: "hook",
          documentId,
          versionId: `${fromVersionId}->${toVersionId}`,
          message: toShortErrorMessage(error),
        })
        throw error
      }
    },
    enabled: Boolean(documentId && fromVersionId && toVersionId),
  })
}

export function useRestoreVersion(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (versionId: string) => {
      documentsLogger.debug({
        event: "version:restore:mutation:start",
        scope: "hook",
        documentId,
        versionId,
      })
      return documentsApi.restoreVersion(documentId, versionId)
    },
    onSuccess: (version) => {
      documentsLogger.info({
        event: "version:restore:mutation:success",
        scope: "hook",
        documentId,
        versionId: version.id,
      })
      queryClient.invalidateQueries({ queryKey: ["document", documentId] })
      queryClient.invalidateQueries({ queryKey: ["document-versions", documentId] })
    },
    onError: (error, versionId) => {
      documentsLogger.error({
        event: "version:restore:mutation:error",
        scope: "hook",
        documentId,
        versionId,
        message: toShortErrorMessage(error),
      })
    },
  })
}

export function useConversionJobs(documentId: string) {
  const previousStatusesRef = useRef<Record<string, ConversionJob["status"]>>({})
  const pollingLoggedRef = useRef(false)

  const query = useQuery({
    queryKey: ["document-conversion-jobs", documentId],
    queryFn: async () => {
      documentsLogger.debug({
        event: "conversionJobs:query:fetch",
        scope: "hook",
        documentId,
      })
      try {
        const jobs = await documentsApi.listConversionJobs(documentId)
        documentsLogger.info({
          event: "conversionJobs:query:success",
          scope: "hook",
          documentId,
          count: jobs.length,
        })
        return jobs
      } catch (error) {
        documentsLogger.error({
          event: "conversionJobs:query:error",
          scope: "hook",
          documentId,
          message: toShortErrorMessage(error),
        })
        throw error
      }
    },
    enabled: Boolean(documentId),
    refetchInterval: 4000,
  })

  useEffect(() => {
    if (!documentId || pollingLoggedRef.current) return
    pollingLoggedRef.current = true
    documentsLogger.info({
      event: "conversionJobs:polling:start",
      scope: "hook",
      documentId,
      attempt: 1,
    })
  }, [documentId])

  useEffect(() => {
    const jobs = query.data ?? []
    const previous = previousStatusesRef.current

    for (const job of jobs) {
      const prevStatus = previous[job.id]
      if (prevStatus && prevStatus !== job.status) {
        documentsLogger.info({
          event: "conversionJobs:polling:transition",
          scope: "hook",
          documentId,
          jobId: job.id,
          status: `${prevStatus}->${job.status}`,
        })
      }
      previous[job.id] = job.status
    }
  }, [documentId, query.data])

  return query
}

export function useCreateConversionJob(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: {
      type: "IMPORT_DOCX" | "EXPORT_DOCX"
      inputAssetId?: string
      sourceVersionId?: string
      requestedFileName?: string
    }) => {
      documentsLogger.debug({
        event: "conversionJob:create:mutation:start",
        scope: "hook",
        documentId,
        status: dto.type,
      })
      return documentsApi.createConversionJob(documentId, dto)
    },
    onSuccess: (job) => {
      documentsLogger.info({
        event: "conversionJob:create:mutation:success",
        scope: "hook",
        documentId,
        jobId: job.id,
        status: job.status,
      })
      queryClient.invalidateQueries({ queryKey: ["document-conversion-jobs", documentId] })
    },
    onError: (error) => {
      documentsLogger.error({
        event: "conversionJob:create:mutation:error",
        scope: "hook",
        documentId,
        message: toShortErrorMessage(error),
      })
    },
  })
}

export function useCancelConversionJob(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobId: string) => {
      documentsLogger.debug({
        event: "conversionJob:cancel:mutation:start",
        scope: "hook",
        documentId,
        jobId,
      })
      return documentsApi.cancelConversionJob(documentId, jobId)
    },
    onSuccess: (data, jobId) => {
      documentsLogger.info({
        event: "conversionJob:cancel:mutation:success",
        scope: "hook",
        documentId,
        jobId: data.id ?? jobId,
        status: data.status,
      })
      queryClient.invalidateQueries({ queryKey: ["document-conversion-jobs", documentId] })
    },
    onError: (error, jobId) => {
      documentsLogger.error({
        event: "conversionJob:cancel:mutation:error",
        scope: "hook",
        documentId,
        jobId,
        message: toShortErrorMessage(error),
      })
    },
  })
}
