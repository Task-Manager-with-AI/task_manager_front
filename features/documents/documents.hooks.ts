"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { documentsApi } from "./documents.api"
import type { CreateDocumentDto, UpdateDocumentDto } from "./documents.types"

export function useProjectDocuments(projectId: string) {
  return useQuery({
    queryKey: ["documents", projectId],
    queryFn: () => documentsApi.listByProject(projectId),
    enabled: Boolean(projectId),
  })
}

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: ["document", documentId],
    queryFn: () => documentsApi.get(documentId),
    enabled: Boolean(documentId),
  })
}

export function useCreateDocument(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateDocumentDto) => documentsApi.create(projectId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", projectId] })
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ documentId, dto }: { documentId: string; dto: UpdateDocumentDto }) =>
      documentsApi.update(documentId, dto),
    onSuccess: (document) => {
      queryClient.invalidateQueries({ queryKey: ["document", document.id] })
      queryClient.invalidateQueries({ queryKey: ["documents", document.projectId] })
    },
  })
}

export function useDeleteDocument(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId: string) => documentsApi.delete(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", projectId] })
    },
  })
}

export function useUploadDocumentAsset(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => documentsApi.uploadAsset(documentId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-assets", documentId] })
    },
  })
}

export function useDocumentAssets(documentId: string) {
  return useQuery({
    queryKey: ["document-assets", documentId],
    queryFn: () => documentsApi.listAssets(documentId),
    enabled: Boolean(documentId),
  })
}

export function useDeleteDocumentAsset(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (assetId: string) => documentsApi.deleteAsset(documentId, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-assets", documentId] })
    },
  })
}
