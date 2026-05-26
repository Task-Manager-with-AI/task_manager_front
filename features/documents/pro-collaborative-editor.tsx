"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { HocuspocusProvider } from "@hocuspocus/provider"
import { Schema } from "prosemirror-model"
import { EditorState } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { schema as basicSchema } from "prosemirror-schema-basic"
import { addListNodes, wrapInList } from "prosemirror-schema-list"
import { baseKeymap, chainCommands, setBlockType, toggleMark } from "prosemirror-commands"
import { keymap } from "prosemirror-keymap"
import { history } from "prosemirror-history"
import {
  redo,
  undo,
  yCursorPlugin,
  ySyncPlugin,
  yUndoPlugin,
} from "y-prosemirror"
import * as Y from "yjs"
import { Bold, Heading1, Heading2, Italic, List, ListOrdered, Redo2, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { documentsLogger } from "./documents.logger"
import type { DocumentPermissionRole } from "./documents.types"

type ProEditorProps = {
  documentId: string
  user: {
    id: string
    name: string
  }
  accessRole?: DocumentPermissionRole
  onTrackChange?: (change: { inserted: number; deleted: number; summary: string }) => void
}

const documentSchema = new Schema({
  nodes: addListNodes(basicSchema.spec.nodes, "paragraph block*", "block"),
  marks: basicSchema.spec.marks,
})

export function ProCollaborativeEditor({
  documentId,
  user,
  accessRole = "EDITOR",
  onTrackChange,
}: ProEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement | null>(null)
  const editorViewRef = useRef<EditorView | null>(null)
  const mountedRef = useRef(false)
  const onTrackChangeRef = useRef(onTrackChange)
  const previousStatusRef = useRef<string | null>(null)
  const [status, setStatus] = useState("connecting")

  const editable = accessRole === "EDITOR"

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    onTrackChangeRef.current = onTrackChange
  }, [onTrackChange])

  useEffect(() => {
    const container = editorContainerRef.current
    if (!container) return

    if (mountedRef.current) {
      setStatus("connecting")
      previousStatusRef.current = "connecting"
    }

    documentsLogger.info({
      event: "proEditor:init",
      scope: "editor",
      documentId,
      status: accessRole,
    })

    container.innerHTML = ""

    const ydoc = new Y.Doc()
    const provider = new HocuspocusProvider({
      url: getCollaborationUrl(),
      name: `document:${documentId}`,
      document: ydoc,
      token: "",
      onStatus: ({ status: nextStatus }) => {
        if (mountedRef.current) {
          setStatus(nextStatus)
        }
        if (previousStatusRef.current !== nextStatus) {
          documentsLogger.info({
            event: "proEditor:status",
            scope: "editor",
            documentId,
            status: nextStatus,
          })
          if (nextStatus === "connected") {
            documentsLogger.info({
              event: "proEditor:ready",
              scope: "editor",
              documentId,
              status: accessRole,
            })
          }
          previousStatusRef.current = nextStatus
        }
      },
      onAuthenticationFailed: () => {
        if (mountedRef.current) {
          setStatus("forbidden")
        }
        documentsLogger.warn({
          event: "proEditor:authFailed",
          scope: "editor",
          documentId,
          status: "forbidden",
        })
      },
    })

    const type = ydoc.getXmlFragment("prosemirror")

    const awareness = provider.awareness
    const plugins = [
      ySyncPlugin(type),
      yUndoPlugin(),
      history(),
      keymap({
        "Mod-z": chainCommands(undo),
        "Mod-y": chainCommands(redo),
        "Mod-Shift-z": chainCommands(redo),
      }),
      keymap(baseKeymap),
    ]

    if (awareness) {
      plugins.splice(
        1,
        0,
        yCursorPlugin(awareness, {
          cursorBuilder: (userInfo) => {
            const cursor = document.createElement("span")
            cursor.classList.add("doc-cursor")
            cursor.style.borderLeft = `2px solid ${String((userInfo as { color?: string }).color ?? "#2563eb")}`
            cursor.style.marginLeft = "-1px"
            cursor.style.marginRight = "-1px"

            const label = document.createElement("div")
            label.classList.add("doc-cursor-label")
            label.style.backgroundColor = String((userInfo as { color?: string }).color ?? "#2563eb")
            label.textContent = String((userInfo as { name?: string }).name ?? "User")
            cursor.appendChild(label)

            return cursor
          },
        })
      )
    }

    const state = EditorState.create({
      schema: documentSchema,
      plugins,
    })

    const view = new EditorView(container, {
      state,
      dispatchTransaction(this: EditorView, transaction) {
        if (this.isDestroyed) return

        const onTrackChangeHandler = onTrackChangeRef.current
        if (transaction.docChanged && editable && onTrackChangeHandler) {
          try {
            const change = summarizeTransaction(transaction)
            if (change.inserted > 0 || change.deleted > 0) {
              onTrackChangeHandler(change)
            }
          } catch {
            // Ignore track-change side effects and keep editor responsive.
          }
        }

        const nextState = this.state.apply(transaction)
        if (this.isDestroyed) return

        try {
          this.updateState(nextState)
        } catch (error) {
          if (!this.isDestroyed) {
            throw error
          }
        }
      },
      editable: () => editable,
      attributes: {
        class: "doc-prosemirror min-h-[60vh] px-6 py-5 text-base leading-7 outline-none",
      },
    })

    provider.awareness?.setLocalStateField("user", {
      id: user.id,
      name: user.name,
      color: stableUserColor(user.id),
    })

    editorViewRef.current = view

    return () => {
      editorViewRef.current?.destroy()
      editorViewRef.current = null
      provider.destroy()
      ydoc.destroy()
      container.innerHTML = ""
      documentsLogger.info({
        event: "proEditor:destroy",
        scope: "editor",
        documentId,
      })
    }
  }, [accessRole, documentId, editable, user.id, user.name])

  const runCommand = (fn: (view: EditorView) => void) => {
    const view = editorViewRef.current
    if (!view || !editable) return
    fn(view)
    view.focus()
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton
            disabled={!editable}
            onClick={() =>
              runCommand((view) => {
                toggleMark(documentSchema.marks.strong)(view.state, view.dispatch)
              })
            }
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            disabled={!editable}
            onClick={() =>
              runCommand((view) => {
                toggleMark(documentSchema.marks.em)(view.state, view.dispatch)
              })
            }
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            disabled={!editable}
            onClick={() =>
              runCommand((view) => {
                ;(setBlockType as unknown as (nodeType: unknown, attrs?: unknown) => (state: unknown, dispatch?: unknown) => boolean)(
                  documentSchema.nodes.heading,
                  { level: 1 }
                )(view.state, view.dispatch)
              })
            }
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            disabled={!editable}
            onClick={() =>
              runCommand((view) => {
                ;(setBlockType as unknown as (nodeType: unknown, attrs?: unknown) => (state: unknown, dispatch?: unknown) => boolean)(
                  documentSchema.nodes.heading,
                  { level: 2 }
                )(view.state, view.dispatch)
              })
            }
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            disabled={!editable}
            onClick={() =>
              runCommand((view) => {
                wrapInList(documentSchema.nodes.bullet_list)(view.state, view.dispatch)
              })
            }
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            disabled={!editable}
            onClick={() =>
              runCommand((view) => {
                wrapInList(documentSchema.nodes.ordered_list)(view.state, view.dispatch)
              })
            }
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            disabled={!editable}
            onClick={() =>
              runCommand((view) => {
                ;(undo as unknown as (state: unknown, dispatch?: unknown) => boolean)(
                  view.state,
                  view.dispatch
                )
              })
            }
          >
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            disabled={!editable}
            onClick={() =>
              runCommand((view) => {
                ;(redo as unknown as (state: unknown, dispatch?: unknown) => boolean)(
                  view.state,
                  view.dispatch
                )
              })
            }
          >
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{statusLabel(status, accessRole)}</div>
      </div>
      <div ref={editorContainerRef} className="document-editor-container bg-white dark:bg-gray-900" />
    </div>
  )
}

function ToolbarButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button type="button" variant="ghost" size="icon" onClick={onClick} disabled={disabled} className="h-8 w-8">
      {children}
    </Button>
  )
}

function statusLabel(status: string, role: DocumentPermissionRole) {
  if (status === "connected") return role === "EDITOR" ? "Connected" : `${role} mode`
  if (status === "forbidden") return "Access denied"
  return "Connecting..."
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

function summarizeTransaction(transaction: { steps: Array<{ toJSON: () => unknown }> }) {
  let inserted = 0
  let deleted = 0

  for (const step of transaction.steps) {
    const json = step.toJSON() as {
      stepType?: string
      from?: number
      to?: number
      slice?: { content?: unknown[] }
    }

    if (json.stepType?.includes("replace")) {
      const from = json.from ?? 0
      const to = json.to ?? from
      deleted += Math.max(0, to - from)
      inserted += getInsertedLength(json.slice?.content)
    }
  }

  return {
    inserted,
    deleted,
    summary: `Inserted ${inserted} chars, deleted ${deleted} chars`,
  }
}

function getInsertedLength(content: unknown[] | undefined): number {
  if (!content) return 0
  let count = 0

  for (const node of content as Array<{ text?: string; content?: unknown[] }>) {
    if (typeof node.text === "string") {
      count += node.text.length
    }
    if (Array.isArray(node.content)) {
      count += getInsertedLength(node.content)
    }
  }

  return count
}

