import { apiClient, ApiError } from "@/lib/api-client"
import type {
  CreateDocumentDto,
  DocumentAsset,
  ProjectDocument,
  UpdateDocumentDto,
} from "./documents.types"

const BASE = "/api/v1"

async function uploadAsset(documentId: string, file: File) {
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

export const documentsApi = {
  listByProject: (projectId: string) =>
    apiClient.get<ProjectDocument[]>(`/projects/${projectId}/documents`),
  create: (projectId: string, dto: CreateDocumentDto) =>
    apiClient.post<ProjectDocument>(`/projects/${projectId}/documents`, dto),
  get: (documentId: string) => apiClient.get<ProjectDocument>(`/documents/${documentId}`),
  update: (documentId: string, dto: UpdateDocumentDto) =>
    apiClient.patch<ProjectDocument>(`/documents/${documentId}`, dto),
  delete: (documentId: string) => apiClient.delete<null>(`/documents/${documentId}`),
  uploadAsset,
  listAssets: (documentId: string) =>
    apiClient.get<DocumentAsset[]>(`/documents/${documentId}/assets`),
  deleteAsset: (documentId: string, assetId: string) =>
    apiClient.delete<null>(`/documents/${documentId}/assets/${assetId}`),
  assetDownloadUrl: (documentId: string, assetId: string) =>
    `${BASE}/documents/${documentId}/assets/${assetId}`,
}
