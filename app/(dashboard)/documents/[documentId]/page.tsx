"use client"

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Download, Paperclip, Save, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useCurrentUser } from "@/features/auth/auth.hooks"
import { documentsApi } from "@/features/documents/documents.api"
import {
  useDocument,
  useDocumentAssets,
  useDeleteDocumentAsset,
  useUpdateDocument,
  useUploadDocumentAsset,
} from "@/features/documents/documents.hooks"

const CollaborativeEditor = dynamic(
  () =>
    import("@/features/documents/collaborative-editor").then(
      (module) => module.CollaborativeEditor
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[70vh] w-full" />,
  }
)

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
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [title, setTitle] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (document?.title) {
      setTitle(document.title)
    }
  }, [document?.title])

  const handleRename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!document || !cleanTitle || cleanTitle === document.title) return

    try {
      setActionError(null)
      await updateDocument({
        documentId,
        dto: {
          title: cleanTitle,
        },
      })
    } catch (error) {
      setActionError(getErrorMessage(error, t("documents.renameError")))
    }
  }

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setActionError(null)
      await uploadAsset(file)
      event.target.value = ""
    } catch (error) {
      setActionError(getErrorMessage(error, t("documents.uploadError")))
    }
  }

  const handleDownload = (assetId: string) => {
    setActionError(null)
    const opened = window.open(
      documentsApi.assetDownloadUrl(documentId, assetId),
      "_blank"
    )

    if (!opened) {
      setActionError(t("documents.downloadError"))
    }
  }

  const handleDeleteAsset = async (assetId: string) => {
    try {
      setActionError(null)
      await deleteAsset(assetId)
    } catch (error) {
      setActionError(getErrorMessage(error, t("documents.deleteAssetError")))
    }
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
            onClick={() => router.push(`/projects/${document.projectId}/documents`)}
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
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">
              {isUploading ? t("documents.uploading") : t("documents.attachFile")}
            </span>
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {actionError}
        </div>
      )}

      <CollaborativeEditor
        documentId={documentId}
        user={{
          id: currentUser.id,
          name: currentUser.name,
        }}
      />

      <div className="mt-6">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("documents.assetsTitle")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("documents.assetsDescription")}
          </p>
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
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      {asset.fileName}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                      {formatBytes(asset.size)}
                    </TableCell>
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
                          disabled={isDeletingAsset}
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
