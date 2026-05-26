"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Collaboration from "@tiptap/extension-collaboration"
import CollaborationCaret from "@tiptap/extension-collaboration-caret"
import { HocuspocusProvider } from "@hocuspocus/provider"
import * as Y from "yjs"
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/locale-provider"
import { documentsLogger } from "./documents.logger"

type CollaborativeEditorProps = {
  documentId: string
  user: {
    id: string
    name: string
  }
}

type CollaborationResources = {
  ydoc: Y.Doc
  provider: HocuspocusProvider
}

export function CollaborativeEditor({ documentId, user }: CollaborativeEditorProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState("connecting")
  const [resources, setResources] = useState<CollaborationResources | null>(null)
  const previousStatusRef = useRef<string | null>(null)

  useEffect(() => {
    let isMounted = true
    let currentResources: CollaborationResources | null = null

    setStatus("connecting")
    previousStatusRef.current = "connecting"
    setResources(null)
    documentsLogger.info({
      event: "legacyEditor:init",
      scope: "editor",
      documentId,
    })

    const timerId = window.setTimeout(() => {
      const ydoc = new Y.Doc()
      const provider = new HocuspocusProvider({
        url: getCollaborationUrl(),
        name: `document:${documentId}`,
        document: ydoc,
        token: "",
        onStatus: ({ status: nextStatus }) => {
          if (isMounted) setStatus(nextStatus)
          if (previousStatusRef.current !== nextStatus) {
            documentsLogger.info({
              event: "legacyEditor:status",
              scope: "editor",
              documentId,
              status: nextStatus,
            })
            if (nextStatus === "connected") {
              documentsLogger.info({
                event: "legacyEditor:ready",
                scope: "editor",
                documentId,
              })
            }
            previousStatusRef.current = nextStatus
          }
        },
        onAuthenticationFailed: () => {
          if (isMounted) setStatus("forbidden")
          documentsLogger.warn({
            event: "legacyEditor:authFailed",
            scope: "editor",
            documentId,
            status: "forbidden",
          })
        },
      })

      currentResources = { ydoc, provider }

      if (isMounted) {
        setResources(currentResources)
      } else {
        provider.destroy()
        ydoc.destroy()
      }
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(timerId)
      currentResources?.provider.destroy()
      currentResources?.ydoc.destroy()
      documentsLogger.info({
        event: "legacyEditor:destroy",
        scope: "editor",
        documentId,
      })
    }
  }, [documentId])

  if (!resources) {
    return <EditorShell status={status} t={t} />
  }

  return (
    <CollaborativeEditorBody
      provider={resources.provider}
      ydoc={resources.ydoc}
      status={status}
      t={t}
      user={user}
    />
  )
}

function CollaborativeEditorBody({
  provider,
  status,
  t,
  user,
  ydoc,
}: {
  provider: HocuspocusProvider
  status: string
  t: (key: string) => string
  user: CollaborativeEditorProps["user"]
  ydoc: Y.Doc
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: false,
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCaret.configure({
        provider,
        user: {
          id: user.id,
          name: user.name,
          color: stableUserColor(user.id),
        },
      }),
    ],
    autofocus: true,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[60vh] w-full max-w-none px-6 py-5 text-base leading-7 text-gray-900 outline-none dark:text-gray-100",
      },
    },
  })

  return (
    <EditorShell
      status={status}
      t={t}
      toolbar={
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton
            label={t("documents.bold")}
            active={editor?.isActive("bold") ?? false}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label={t("documents.italic")}
            active={editor?.isActive("italic") ?? false}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label={t("documents.heading1")}
            active={editor?.isActive("heading", { level: 1 }) ?? false}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label={t("documents.heading2")}
            active={editor?.isActive("heading", { level: 2 }) ?? false}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label={t("documents.bulletList")}
            active={editor?.isActive("bulletList") ?? false}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label={t("documents.orderedList")}
            active={editor?.isActive("orderedList") ?? false}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label={t("documents.blockquote")}
            active={editor?.isActive("blockquote") ?? false}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label={t("documents.undo")}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label={t("documents.redo")}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </div>
      }
    >
      <EditorContent editor={editor} className="document-editor" />
    </EditorShell>
  )
}

function EditorShell({
  children,
  status,
  t,
  toolbar,
}: {
  children?: React.ReactNode
  status: string
  t: (key: string) => string
  toolbar?: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        {toolbar ?? <div />}
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {statusLabel(status, t)}
        </div>
      </div>
      {children ?? <div className="min-h-[60vh] px-6 py-5" />}
    </div>
  )
}

function ToolbarButton({
  active,
  children,
  label,
  onClick,
}: {
  active?: boolean
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="h-8 w-8"
    >
      {children}
    </Button>
  )
}

function getCollaborationUrl() {
  if (process.env.NEXT_PUBLIC_COLLABORATION_URL) {
    return process.env.NEXT_PUBLIC_COLLABORATION_URL
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"
  const backendUrl = apiUrl.replace(/\/api\/v1\/?$/, "")
  const wsUrl = backendUrl.replace(/^http/, "ws")
  return `${wsUrl.replace(/:(\d+)(\/?)$/, (_match, port) => `:${Number(port) + 1}`)}/collaboration`
}

function stableUserColor(userId: string) {
  const colors = ["#2563eb", "#059669", "#dc2626", "#7c3aed", "#d97706", "#0891b2"]
  let hash = 0
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash * 31 + userId.charCodeAt(index)) % colors.length
  }
  return colors[hash]
}

function statusLabel(status: string, t: (key: string) => string) {
  if (status === "connected") return t("documents.connected")
  if (status === "forbidden") return t("documents.forbidden")
  return t("documents.connecting")
}
