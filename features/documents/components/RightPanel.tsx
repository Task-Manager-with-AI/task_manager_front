"use client"

import { useState } from "react"
import { format } from "date-fns"
import { MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/components/locale-provider"
import type { DocumentPermissionRole } from "@/features/documents/documents.types"

type RightPanelProps = {
  accessRole: DocumentPermissionRole
  commentThreads: any[]
  isCreatingThread: boolean
  isResolvingThread: boolean
  isAddingComment: boolean
  handleCreateThread: (text: string) => void
  handleToggleThreadResolution: (id: string, resolved: boolean) => void
  handleAddComment: (threadId: string, text: string) => void
  versions: any[]
  latestVersionId?: string
  handleRestoreVersionAction: (id: string) => void
  isRestoringVersion: boolean
  selectedVersionId?: string
  onSelectVersion?: (id: string) => void
}

export function RightPanel({
  accessRole,
  commentThreads,
  isCreatingThread,
  isResolvingThread,
  isAddingComment,
  handleCreateThread,
  handleToggleThreadResolution,
  handleAddComment,
  versions,
  handleRestoreVersionAction,
  isRestoringVersion,
  selectedVersionId,
  onSelectVersion,
}: RightPanelProps) {
  const { t } = useTranslation()
  const [newThreadText, setNewThreadText] = useState("")
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})

  const onSubmitThread = () => {
    handleCreateThread(newThreadText)
    setNewThreadText("")
  }

  const onSubmitComment = (threadId: string) => {
    handleAddComment(threadId, commentDrafts[threadId] || "")
    setCommentDrafts((prev) => ({ ...prev, [threadId]: "" }))
  }

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shrink-0">
      <Tabs defaultValue="historial" className="flex h-full flex-col">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="historial">Historial</TabsTrigger>
            <TabsTrigger value="comentarios">Comentarios</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="historial" className="flex-1 overflow-y-auto p-4 m-0 data-[state=inactive]:hidden">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Versiones Guardadas
          </h3>
          <div className="space-y-4">
            {(versions ?? []).map((version) => (
              <div
                key={version.id}
                className={`flex flex-col gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                  selectedVersionId === version.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                }`}
                onClick={() => onSelectVersion?.(version.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {format(new Date(version.createdAt), "dd MMM yyyy, HH:mm")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {version.createdBy?.name || "Sistema"}
                    </div>
                  </div>
                </div>
                {selectedVersionId === version.id && (
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    disabled={isRestoringVersion || accessRole === "VIEWER"}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRestoreVersionAction(version.id)
                    }}
                  >
                    Restaurar esta versión
                  </Button>
                )}
              </div>
            ))}
            {(versions ?? []).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No hay historial aún.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="comentarios" className="flex-1 overflow-y-auto p-4 m-0 data-[state=inactive]:hidden flex flex-col gap-4">
          <div className="flex gap-2">
            <Textarea
              value={newThreadText}
              onChange={(event) => setNewThreadText(event.target.value)}
              placeholder="Nuevo hilo de comentarios..."
              className="min-h-[72px] resize-none"
            />
            <Button
              type="button"
              size="icon"
              disabled={isCreatingThread || accessRole === "VIEWER" || !newThreadText.trim()}
              onClick={onSubmitThread}
            >
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            {(commentThreads ?? []).map((thread) => (
              <div key={thread.id} className="rounded-md border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-800/20">
                <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
                  <span className={thread.isResolved ? "text-green-600 font-medium" : ""}>
                    {thread.isResolved ? "Resuelto" : "Abierto"}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs px-2"
                    disabled={isResolvingThread || accessRole === "VIEWER"}
                    onClick={() => handleToggleThreadResolution(thread.id, !thread.isResolved)}
                  >
                    {thread.isResolved ? "Reabrir" : "Resolver"}
                  </Button>
                </div>
                <div className="space-y-3">
                  {thread.comments.map((comment: any) => (
                    <div key={comment.id} className="rounded-md bg-white p-2 shadow-sm border border-gray-100 text-sm dark:bg-gray-800 dark:border-gray-700">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        {comment.author?.name ?? "Usuario"}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 leading-relaxed">{comment.body}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    value={commentDrafts[thread.id] ?? ""}
                    onChange={(event) =>
                      setCommentDrafts((prev) => ({ ...prev, [thread.id]: event.target.value }))
                    }
                    placeholder="Responder..."
                    className="h-8 text-sm"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8"
                    disabled={isAddingComment || thread.isResolved || accessRole === "VIEWER" || !(commentDrafts[thread.id]?.trim())}
                    onClick={() => onSubmitComment(thread.id)}
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            ))}
            {(commentThreads ?? []).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No hay comentarios activos.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
