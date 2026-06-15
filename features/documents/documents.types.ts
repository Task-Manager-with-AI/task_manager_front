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
  accessRole?: DocumentPermissionRole
}

export interface CreateDocumentDto {
  title: string
}

export interface UpdateDocumentDto {
  title: string
}

export type DocumentPermissionRole = "VIEWER" | "COMMENTER" | "EDITOR"

export type DocumentOutlineHeadingLevel = 1 | 2 | 3

export interface DocumentOutlineHeading {
  level: DocumentOutlineHeadingLevel
  text: string
  pos: number
  numbering: string
  displayText: string
}

export interface DocumentPermission {
  id: string
  documentId: string
  userId: string
  role: DocumentPermissionRole
  createdAt: string
  updatedAt: string
  user?: DocumentAuthor
}

export interface CommentEntry {
  id: string
  threadId: string
  authorId: string
  body: string
  mentions: string[]
  createdAt: string
  updatedAt: string
  author?: DocumentAuthor
}

export interface CommentThread {
  id: string
  documentId: string
  createdById: string
  anchorFrom?: number | null
  anchorTo?: number | null
  quoteText?: string | null
  isResolved: boolean
  createdAt: string
  updatedAt: string
  comments: CommentEntry[]
}

export interface DocumentSuggestion {
  id: string
  documentId: string
  createdById: string
  type: "INSERT" | "DELETE" | "FORMAT" | "REPLACE"
  status: "OPEN" | "ACCEPTED" | "REJECTED"
  anchorFrom?: number | null
  anchorTo?: number | null
  note?: string | null
  createdAt: string
  updatedAt: string
}

export interface DocumentVersion {
  id: string
  documentId: string
  createdById?: string | null
  source: string
  plainText?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  createdBy?: DocumentAuthor
}

export interface DocumentDiff {
  fromVersionId: string
  toVersionId: string
  summary: {
    fromLength: number
    toLength: number
    deltaLength: number
  }
  diff: Array<{
    index: number
    from?: string
    to?: string
    type: "added" | "removed" | "changed"
  }>
}

export interface ConversionJob {
  id: string
  documentId: string
  type: "IMPORT_DOCX" | "EXPORT_DOCX"
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELED"
  inputAssetId?: string | null
  outputAssetId?: string | null
  sourceVersionId?: string | null
  resultVersionId?: string | null
  requestedFileName?: string | null
  providerJobId?: string | null
  errorMessage?: string | null
  createdAt: string
  updatedAt: string
}

