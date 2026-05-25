export interface DocumentAuthor {
  id: string
  name: string
  email: string
}

export interface DocumentAsset {
  id: string
  documentId: string
  fileName: string
  mimeType: string
  size: number
  uploadedById: string
  createdAt: string
  uploadedBy?: DocumentAuthor
}

export interface ProjectDocument {
  id: string
  projectId: string
  createdById: string
  title: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  createdBy?: DocumentAuthor
  _count?: {
    assets: number
  }
}

export interface CreateDocumentDto {
  title: string
}

export interface UpdateDocumentDto {
  title: string
}
