"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { HocuspocusProvider } from "@hocuspocus/provider"
import { Schema } from "prosemirror-model"
import { EditorState, Selection } from "prosemirror-state"
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
import { Bold, Eraser, Heading1, Heading2, Heading3, Italic, List, ListOrdered, Palette, Redo2, Undo2, Network, RotateCw, AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { documentsLogger } from "./documents.logger"
import type { DocumentOutlineHeading, DocumentPermissionRole } from "./documents.types"
import { EaDiagramModal } from "./components/EaDiagramModal"
import { toast } from "sonner"

type ProEditorProps = {
  documentId: string
  user: {
    id: string
    name: string
  }
  accessRole?: DocumentPermissionRole
  onTrackChange?: (change: { inserted: number; deleted: number; summary: string }) => void
  onActiveUsersChange?: (users: Array<{ id: string; name: string; color: string }>) => void
  onOutlineChange?: (headings: DocumentOutlineHeading[]) => void
  editorRef?: React.RefObject<{ scrollToPos: (pos: number) => void } | null>
  scrollContainerRef?: React.RefObject<HTMLElement | null>
}

const HEADING_SCROLL_MARGIN_PX = 20
const HEADING_HIGHLIGHT_DURATION_MS = 1000

let customNodes = basicSchema.spec.nodes
let customMarks = basicSchema.spec.marks
const imageNode = customNodes.get("image")
if (imageNode) {
  const customImageNode = {
    ...imageNode,
    attrs: {
      ...imageNode.attrs,
      rotation: { default: 0 },
      align: { default: "center" },
      width: { default: null },
    },
    // The toDOM is technically overridden by NodeView, but we keep it for schema completeness
    toDOM(node: any) {
      const { src, alt, title, rotation, align, width } = node.attrs
      
      let marginStyle = "margin: 1rem auto;" // center por defecto
      if (align === "left") marginStyle = "margin: 1rem auto 1rem 0;"
      if (align === "right") marginStyle = "margin: 1rem 0 1rem auto;"
      
      let widthStyle = width ? `width: ${width}px;` : "max-width: 100%;"
      
      return [
        "img",
        {
          src,
          alt,
          title,
          style: `transform: rotate(${rotation || 0}deg); transition: transform 0.2s ease-in-out; cursor: grab; display: block; ${marginStyle} transform-origin: center; ${widthStyle}`,
          class: "prose-image-draggable",
        },
      ] as any
    },
  }
  customNodes = customNodes.update("image", customImageNode)
}

const textColorMark = {
  attrs: {
    color: {},
  },
  inclusive: true,
  parseDOM: [
    {
      style: "color",
      getAttrs: (value: string) => {
        if (!value) return false
        return { color: value }
      },
    },
  ],
  toDOM(mark: { attrs: { color?: string } }) {
    return [
      "span",
      {
        style: mark.attrs.color ? `color: ${mark.attrs.color};` : "",
      },
      0,
    ] as any
  },
}

customMarks = customMarks.addToEnd("text_color", textColorMark as any)

const fontSizeMark = {
  attrs: {
    size: {},
  },
  inclusive: true,
  parseDOM: [
    {
      style: "font-size",
      getAttrs: (value: string) => {
        if (!value) return false
        return { size: value }
      },
    },
  ],
  toDOM(mark: { attrs: { size?: string } }) {
    return [
      "span",
      {
        style: mark.attrs.size ? `font-size: ${mark.attrs.size};` : "",
      },
      0,
    ] as any
  },
}

customMarks = customMarks.addToEnd("font_size", fontSizeMark as any)

const fontFamilyMark = {
  attrs: {
    family: {},
  },
  inclusive: true,
  parseDOM: [
    {
      style: "font-family",
      getAttrs: (value: string) => {
        if (!value) return false
        return { family: value }
      },
    },
  ],
  toDOM(mark: { attrs: { family?: string } }) {
    return [
      "span",
      {
        style: mark.attrs.family ? `font-family: ${mark.attrs.family};` : "",
      },
      0,
    ] as any
  },
}

customMarks = customMarks.addToEnd("font_family", fontFamilyMark as any)

class ImageNodeView {
  dom: HTMLElement
  img: HTMLImageElement
  handle: HTMLElement
  node: any
  view: EditorView
  getPos: () => number | undefined

  constructor(node: any, view: EditorView, getPos: () => number | undefined) {
    this.node = node
    this.view = view
    this.getPos = getPos

    this.dom = document.createElement("span")
    this.dom.className = "image-wrapper prose-image-draggable"

    this.img = document.createElement("img")
    this.updateImgAttrs(node.attrs)
    this.dom.appendChild(this.img)

    this.handle = document.createElement("div")
    this.handle.className = "resize-handle"
    this.dom.appendChild(this.handle)

    this.onMouseDown = this.onMouseDown.bind(this)
    this.handle.addEventListener("mousedown", this.onMouseDown)
  }

  updateImgAttrs(attrs: any) {
    const { src, alt, title, rotation, align, width } = attrs
    this.img.src = src
    if (alt) this.img.alt = alt
    if (title) this.img.title = title
    
    let marginStyle = "margin: 1rem auto;"
    if (align === "left") marginStyle = "margin: 1rem auto 1rem 0;"
    if (align === "right") marginStyle = "margin: 1rem 0 1rem auto;"
    
    let widthStyle = width ? `width: ${width}px;` : "max-width: 100%;"
    
    this.img.style.cssText = `transform: rotate(${rotation || 0}deg); transition: transform 0.2s ease-in-out; cursor: grab; display: block; ${marginStyle} transform-origin: center; ${widthStyle}`
  }

  onMouseDown(e: MouseEvent) {
    e.preventDefault()
    const startX = e.pageX
    const startWidth = this.img.clientWidth

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.pageX
      const newWidth = Math.max(50, startWidth + (currentX - startX))
      this.img.style.width = `${newWidth}px`
    }

    const onMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
      
      const pos = this.getPos()
      if (typeof pos === "number") {
        const currentX = upEvent.pageX
        const newWidth = Math.max(50, startWidth + (currentX - startX))
        
        const tr = this.view.state.tr.setNodeMarkup(pos, null, {
          ...this.node.attrs,
          width: newWidth
        })
        this.view.dispatch(tr)
      }
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
  }

  update(node: any) {
    if (node.type !== this.node.type) return false
    this.node = node
    this.updateImgAttrs(node.attrs)
    return true
  }

  destroy() {
    this.handle.removeEventListener("mousedown", this.onMouseDown)
  }
}

const documentSchema = new Schema({
  nodes: addListNodes(customNodes, "paragraph block*", "block"),
  marks: customMarks,
})

const TEXT_COLOR_SWATCHES = ["#1D4ED8", "#0F766E", "#B91C1C", "#7C3AED", "#EA580C", "#111827"]
const FONT_SIZE_OPTIONS = [
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "24", value: "24px" },
  { label: "32", value: "32px" },
]

const FONT_FAMILY_OPTIONS = [
  { label: "Inter / Sans", value: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { label: "Serif", value: 'ui-serif, Georgia, Cambria, "Times New Roman", serif' },
  { label: "Mono", value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace' },
]

function extractHeadings(doc: any): DocumentOutlineHeading[] {
  const counters = [0, 0, 0]
  const headings: DocumentOutlineHeading[] = []
  doc.descendants((node: any, pos: number) => {
    if (node.type.name === "heading") {
      const rawLevel = Number(node.attrs.level || 1)
      const level = Math.max(1, Math.min(3, rawLevel)) as 1 | 2 | 3

      if (level === 2 && counters[0] === 0) {
        counters[0] = 1
      }

      if (level === 3) {
        if (counters[0] === 0) counters[0] = 1
        if (counters[1] === 0) counters[1] = 1
      }

      counters[level - 1] += 1
      for (let index = level; index < counters.length; index += 1) {
        counters[index] = 0
      }

      const numbering = counters.slice(0, level).join(".")
      const text = node.textContent ?? ""

      headings.push({
        level,
        text,
        pos,
        numbering,
        displayText: `${numbering}. ${text.trim() || fallbackTitle(level)}`,
      })
    }
    return true
  })
  return headings
}

function fallbackTitle(level: 1 | 2 | 3) {
  if (level === 1) return "Titulo sin texto"
  if (level === 2) return "Subtitulo sin texto"
  return "Subtitulo de tercer nivel sin texto"
}

function applyHeadingNumbering(view: EditorView, headings: DocumentOutlineHeading[]) {
  const renderedHeadingNodes = view.dom.querySelectorAll<HTMLElement>("[data-heading-numbering]")
  renderedHeadingNodes.forEach((element) => {
    element.removeAttribute("data-heading-numbering")
    element.removeAttribute("data-heading-level")
  })

  for (const heading of headings) {
    const nodeDom = view.nodeDOM(heading.pos)
    if (!(nodeDom instanceof HTMLElement)) continue
    nodeDom.setAttribute("data-heading-numbering", `${heading.numbering}.`)
    nodeDom.setAttribute("data-heading-level", String(heading.level))
  }
}

function resolveHeadingSelection(view: EditorView, pos: number) {
  const docSize = view.state.doc.content.size
  const safePos = Math.max(0, Math.min(pos, docSize))
  const innerPos = Math.max(0, Math.min(pos + 1, docSize))

  try {
    return Selection.near(view.state.doc.resolve(innerPos), 1)
  } catch {
    return Selection.near(view.state.doc.resolve(safePos), 1)
  }
}

function findScrollContainer(
  explicitContainer: HTMLElement | null | undefined,
  editorContainer: HTMLElement | null
) {
  if (explicitContainer) {
    return explicitContainer
  }

  return editorContainer?.closest("[data-document-scroll-container='true']") as HTMLElement | null
}

function getToolbarOffset(editorContainer: HTMLElement | null) {
  const toolbar = editorContainer?.parentElement?.querySelector<HTMLElement>("[data-document-editor-toolbar='true']")
  return (toolbar?.offsetHeight ?? 0) + HEADING_SCROLL_MARGIN_PX
}

function scrollHeadingIntoView({
  view,
  pos,
  scrollContainer,
  editorContainer,
}: {
  view: EditorView
  pos: number
  scrollContainer: HTMLElement | null
  editorContainer: HTMLElement | null
}) {
  const targetNode = view.nodeDOM(pos)
  const offset = getToolbarOffset(editorContainer)

  if (targetNode instanceof HTMLElement && scrollContainer) {
    const containerRect = scrollContainer.getBoundingClientRect()
    const targetRect = targetNode.getBoundingClientRect()
    const top = scrollContainer.scrollTop + (targetRect.top - containerRect.top) - offset

    scrollContainer.scrollTo({
      top: Math.max(0, top),
      behavior: "smooth",
    })

    return targetNode
  }

  try {
    const coords = view.coordsAtPos(Math.max(0, Math.min(pos, view.state.doc.content.size)))
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect()
      const top = scrollContainer.scrollTop + (coords.top - containerRect.top) - offset
      scrollContainer.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth",
      })
    } else {
      window.scrollTo({
        top: Math.max(0, window.scrollY + coords.top - offset),
        behavior: "smooth",
      })
    }
  } catch {
    // Ignore scroll fallback failures and keep the editor usable.
  }

  return targetNode instanceof HTMLElement ? targetNode : null
}

function getCurrentTextColor(state: EditorState) {
  const colorMark = documentSchema.marks.text_color
  if (!colorMark) return null

  const storedMark = state.storedMarks?.find((mark) => mark.type === colorMark)
  if (storedMark?.attrs.color) {
    return String(storedMark.attrs.color)
  }

  const { from, to, empty, $from } = state.selection

  if (empty) {
    const activeMark = colorMark.isInSet($from.marks())
    return activeMark?.attrs.color ? String(activeMark.attrs.color) : null
  }

  let detectedColor: string | null = null
  state.doc.nodesBetween(from, to, (node) => {
    if (!node.isText) return
    const activeMark = colorMark.isInSet(node.marks)
    if (!activeMark?.attrs.color) return
    if (detectedColor === null) {
      detectedColor = String(activeMark.attrs.color)
    }
  })

  return detectedColor
}

function applyTextColor(view: EditorView, color: string | null) {
  const colorMark = documentSchema.marks.text_color
  if (!colorMark) return

  const { state } = view
  const { from, to, empty } = state.selection
  let tr = state.tr

  if (empty) {
    tr = tr.removeStoredMark(colorMark)
    if (color) {
      tr = tr.addStoredMark(colorMark.create({ color }))
    }
    view.dispatch(tr)
    return
  }

  tr = tr.removeMark(from, to, colorMark)
  if (color) {
    tr = tr.addMark(from, to, colorMark.create({ color }))
  }
  view.dispatch(tr.scrollIntoView())
}

function getCurrentFontSize(state: EditorState) {
  const sizeMark = documentSchema.marks.font_size
  if (!sizeMark) return null

  const storedMark = state.storedMarks?.find((mark) => mark.type === sizeMark)
  if (storedMark?.attrs.size) {
    return String(storedMark.attrs.size)
  }

  const { from, to, empty, $from } = state.selection

  if (empty) {
    const activeMark = sizeMark.isInSet($from.marks())
    return activeMark?.attrs.size ? String(activeMark.attrs.size) : null
  }

  let detectedSize: string | null = null
  state.doc.nodesBetween(from, to, (node) => {
    if (!node.isText) return
    const activeMark = sizeMark.isInSet(node.marks)
    if (!activeMark?.attrs.size) return
    if (detectedSize === null) {
      detectedSize = String(activeMark.attrs.size)
    }
  })

  return detectedSize
}

function applyFontSize(view: EditorView, size: string | null) {
  const sizeMark = documentSchema.marks.font_size
  if (!sizeMark) return

  const { state } = view
  const { from, to, empty } = state.selection
  let tr = state.tr

  if (empty) {
    tr = tr.removeStoredMark(sizeMark)
    if (size) {
      tr = tr.addStoredMark(sizeMark.create({ size }))
    }
    view.dispatch(tr)
    return
  }

  tr = tr.removeMark(from, to, sizeMark)
  if (size) {
    tr = tr.addMark(from, to, sizeMark.create({ size }))
  }
  view.dispatch(tr.scrollIntoView())
}

function getCurrentFontFamily(state: EditorState) {
  const familyMark = documentSchema.marks.font_family
  if (!familyMark) return null

  const storedMark = state.storedMarks?.find((mark) => mark.type === familyMark)
  if (storedMark?.attrs.family) {
    return String(storedMark.attrs.family)
  }

  const { from, to, empty, $from } = state.selection

  if (empty) {
    const activeMark = familyMark.isInSet($from.marks())
    return activeMark?.attrs.family ? String(activeMark.attrs.family) : null
  }

  let detectedFamily: string | null = null
  state.doc.nodesBetween(from, to, (node) => {
    if (!node.isText) return
    const activeMark = familyMark.isInSet(node.marks)
    if (!activeMark?.attrs.family) return
    if (detectedFamily === null) {
      detectedFamily = String(activeMark.attrs.family)
    }
  })

  return detectedFamily
}

function applyFontFamily(view: EditorView, family: string | null) {
  const familyMark = documentSchema.marks.font_family
  if (!familyMark) return

  const { state } = view
  const { from, to, empty } = state.selection
  let tr = state.tr

  if (empty) {
    tr = tr.removeStoredMark(familyMark)
    if (family) {
      tr = tr.addStoredMark(familyMark.create({ family }))
    }
    view.dispatch(tr)
    return
  }

  tr = tr.removeMark(from, to, familyMark)
  if (family) {
    tr = tr.addMark(from, to, familyMark.create({ family }))
  }
  view.dispatch(tr.scrollIntoView())
}

export function ProCollaborativeEditor({
  documentId,
  user,
  accessRole = "EDITOR",
  onTrackChange,
  onActiveUsersChange,
  onOutlineChange,
  editorRef,
  scrollContainerRef,
}: ProEditorProps) {
  const PAGE_HEIGHT_PX = 1056
  const editorContainerRef = useRef<HTMLDivElement | null>(null)
  const editorViewRef = useRef<EditorView | null>(null)
  const activeHeadingElementRef = useRef<HTMLElement | null>(null)
  const headingHighlightTimeoutRef = useRef<number | null>(null)
  const mountedRef = useRef(false)
  const onTrackChangeRef = useRef(onTrackChange)
  const previousStatusRef = useRef<string | null>(null)
  const [status, setStatus] = useState("connecting")
  const [isEaModalOpen, setIsEaModalOpen] = useState(false)
  const [pageCount, setPageCount] = useState(1)
  const [currentTextColor, setCurrentTextColor] = useState<string | null>(null)
  const [currentFontSize, setCurrentFontSize] = useState<string | null>(null)
  const [currentFontFamily, setCurrentFontFamily] = useState<string | null>(null)
  const outlineStateRef = useRef<DocumentOutlineHeading[]>([])

  const onOutlineChangeRef = useRef(onOutlineChange)
  const lastHeadingsStrRef = useRef("")
  const colorInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    onOutlineChangeRef.current = onOutlineChange
  }, [onOutlineChange])

  useEffect(() => {
    if (editorRef) {
      const jumpToHeading = (pos: number, allowRetry = true) => {
        const view = editorViewRef.current
        if (!view) return

        try {
          const selection = resolveHeadingSelection(view, pos)
          view.dispatch(view.state.tr.setSelection(selection))
          view.focus()

          const highlightedNode = scrollHeadingIntoView({
            view,
            pos,
            scrollContainer: findScrollContainer(scrollContainerRef?.current, editorContainerRef.current),
            editorContainer: editorContainerRef.current,
          })

          if (highlightedNode instanceof HTMLElement) {
            activeHeadingElementRef.current?.classList.remove("document-heading-jump-target")
            highlightedNode.classList.add("document-heading-jump-target")
            activeHeadingElementRef.current = highlightedNode

            if (headingHighlightTimeoutRef.current) {
              window.clearTimeout(headingHighlightTimeoutRef.current)
            }

            headingHighlightTimeoutRef.current = window.setTimeout(() => {
              highlightedNode.classList.remove("document-heading-jump-target")
              if (activeHeadingElementRef.current === highlightedNode) {
                activeHeadingElementRef.current = null
              }
              headingHighlightTimeoutRef.current = null
            }, HEADING_HIGHLIGHT_DURATION_MS)
          } else if (allowRetry) {
            requestAnimationFrame(() => {
              jumpToHeading(pos, false)
            })
          }
        } catch (error) {
          console.error("Error scrolling to position:", error)
        }
      }

      (editorRef as any).current = {
        scrollToPos: (pos: number) => {
          jumpToHeading(pos)
        },
      }
    }
    return () => {
      if (headingHighlightTimeoutRef.current) {
        window.clearTimeout(headingHighlightTimeoutRef.current)
        headingHighlightTimeoutRef.current = null
      }
      activeHeadingElementRef.current?.classList.remove("document-heading-jump-target")
      activeHeadingElementRef.current = null
      if (editorRef) {
        (editorRef as any).current = null
      }
    }
  }, [editorRef, scrollContainerRef])

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

  const onActiveUsersChangeRef = useRef(onActiveUsersChange)
  useEffect(() => {
    onActiveUsersChangeRef.current = onActiveUsersChange
  }, [onActiveUsersChange])

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
      nodeViews: {
        image(node, view, getPos) {
          return new ImageNodeView(node, view, getPos)
        }
      },
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

        if (transaction.docChanged) {
          try {
            const nextHeadings = extractHeadings(nextState.doc)
            outlineStateRef.current = nextHeadings
            const nextStr = JSON.stringify(nextHeadings)
            if (nextStr !== lastHeadingsStrRef.current) {
              lastHeadingsStrRef.current = nextStr
              setTimeout(() => {
                if (mountedRef.current) {
                  onOutlineChangeRef.current?.(nextHeadings)
                }
              }, 0)
            }
          } catch (error) {
            console.error("Error extracting headings in transaction:", error)
          }
        }

        try {
          this.updateState(nextState)
          setCurrentTextColor(getCurrentTextColor(nextState))
          setCurrentFontSize(getCurrentFontSize(nextState))
          setCurrentFontFamily(getCurrentFontFamily(nextState))
          if (transaction.docChanged) {
            applyHeadingNumbering(this, outlineStateRef.current)
          }
        } catch (error) {
          if (!this.isDestroyed) {
            throw error
          }
        }
      },
      editable: () => editable,
      attributes: {
        class: "doc-prosemirror document-editor-flow min-h-[1056px] w-[816px] max-w-full mx-auto px-16 py-12 text-base leading-7 outline-none bg-transparent",
      },
    })

    provider.awareness?.setLocalStateField("user", {
      id: user.id,
      name: user.name,
      color: stableUserColor(user.id),
    })

    provider.awareness?.on("change", () => {
      if (!mountedRef.current) return
      const states = Array.from(provider.awareness?.getStates().values() ?? [])
      const users = states.map((s: any) => s.user).filter(Boolean)
      const uniqueUsers = Array.from(new Map(users.map((u) => [u.id, u])).values())
      onActiveUsersChangeRef.current?.(uniqueUsers)
    })

    editorViewRef.current = view
    setCurrentTextColor(getCurrentTextColor(view.state))
    setCurrentFontSize(getCurrentFontSize(view.state))
    setCurrentFontFamily(getCurrentFontFamily(view.state))

    const editorElement = view.dom as HTMLElement
    const syncPageCount = () => {
      const nextPageCount = Math.max(1, Math.ceil(editorElement.scrollHeight / PAGE_HEIGHT_PX))
      setPageCount((current) => (current === nextPageCount ? current : nextPageCount))
    }

    syncPageCount()

    const resizeObserver = new ResizeObserver(() => {
      syncPageCount()
    })
    resizeObserver.observe(editorElement)

    // Run initial headings extraction
    if (onOutlineChangeRef.current) {
      try {
        const initialHeadings = extractHeadings(view.state.doc)
        const initialStr = JSON.stringify(initialHeadings)
        lastHeadingsStrRef.current = initialStr
        outlineStateRef.current = initialHeadings
        onOutlineChangeRef.current(initialHeadings)
        applyHeadingNumbering(view, initialHeadings)
      } catch (error) {
        console.error("Error extracting initial headings:", error)
      }
    }

    return () => {
      resizeObserver.disconnect()
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
    <div className="flex flex-col h-full bg-transparent">
      <div
        data-document-editor-toolbar="true"
        className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-950"
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-1">
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
                ;(setBlockType as unknown as (nodeType: unknown, attrs?: unknown) => (state: unknown, dispatch?: unknown) => boolean)(
                  documentSchema.nodes.heading,
                  { level: 3 }
                )(view.state, view.dispatch)
              })
            }
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <div className="mx-1 flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 dark:border-gray-800 dark:bg-gray-900">
            <ToolbarButton
              disabled={!editable}
              onClick={() => colorInputRef.current?.click()}
              title="Cambiar color del texto"
            >
              <Palette className="h-4 w-4" style={{ color: currentTextColor ?? undefined }} />
            </ToolbarButton>
            {TEXT_COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Aplicar color ${color}`}
                className={`h-5 w-5 rounded-full border transition-transform hover:scale-105 ${
                  currentTextColor === color
                    ? "border-gray-900 ring-2 ring-offset-1 dark:border-white dark:ring-gray-300"
                    : "border-white/70 dark:border-gray-800"
                }`}
                style={{ backgroundColor: color }}
                disabled={!editable}
                onClick={() =>
                  runCommand((view) => {
                    applyTextColor(view, color)
                    setCurrentTextColor(color)
                  })
                }
              />
            ))}
            <ToolbarButton
              disabled={!editable}
              onClick={() =>
                runCommand((view) => {
                  applyTextColor(view, null)
                  setCurrentTextColor(null)
                })
              }
              title="Quitar color del texto"
            >
              <Eraser className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </ToolbarButton>
            <input
              ref={colorInputRef}
              type="color"
              className="sr-only"
              value={currentTextColor ?? "#1D4ED8"}
              onChange={(event) =>
                runCommand((view) => {
                  applyTextColor(view, event.target.value)
                  setCurrentTextColor(event.target.value)
                })
              }
            />
          </div>
          <div className="mx-1 flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 dark:border-gray-800 dark:bg-gray-900">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Tamaño
            </span>
            <Select
              value={currentFontSize ?? "default"}
              onValueChange={(value) =>
                runCommand((view) => {
                  const nextSize = value === "default" ? null : value
                  applyFontSize(view, nextSize)
                  setCurrentFontSize(nextSize)
                })
              }
            >
              <SelectTrigger className="h-8 w-[92px] border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-950">
                <SelectValue placeholder="Base" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Base</SelectItem>
                {FONT_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mx-1 flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 dark:border-gray-800 dark:bg-gray-900">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              Fuente
            </span>
            <Select
              value={currentFontFamily ?? "default"}
              onValueChange={(value) =>
                runCommand((view) => {
                  const nextFamily = value === "default" ? null : value
                  applyFontFamily(view, nextFamily)
                  setCurrentFontFamily(nextFamily)
                })
              }
            >
              <SelectTrigger className="h-8 w-[146px] border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-950">
                <SelectValue placeholder="Base" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Base</SelectItem>
                {FONT_FAMILY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          <ToolbarButton
            disabled={!editable}
            onClick={() => setIsEaModalOpen(true)}
            title="Generar Diagrama EA"
          >
            <Network className="h-4 w-4 text-blue-600" />
          </ToolbarButton>
          <ToolbarButton
            disabled={!editable}
            onClick={() =>
              runCommand((view) => {
                const { state, dispatch } = view
                const { selection } = state
                const nodeSelection = selection as any
                
                if (nodeSelection.node && nodeSelection.node.type.name === "image") {
                  const currentRotation = nodeSelection.node.attrs.rotation || 0
                  const newRotation = (currentRotation + 90) % 360
                  const tr = state.tr.setNodeMarkup(selection.from, null, {
                    ...nodeSelection.node.attrs,
                    rotation: newRotation
                  })
                  dispatch(tr)
                } else {
                  toast.info("Por favor haz clic sobre una imagen para seleccionarla antes de rotar.")
                }
              })
            }
            title="Rotar Imagen Seleccionada 90°"
          >
            <RotateCw className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </ToolbarButton>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1" />
          <ToolbarButton
            disabled={!editable}
            onClick={() =>
              runCommand((view) => {
                const { state, dispatch } = view
                const { selection } = state
                const nodeSelection = selection as any
                
                if (nodeSelection.node && nodeSelection.node.type.name === "image") {
                  const tr = state.tr.setNodeMarkup(selection.from, null, {
                    ...nodeSelection.node.attrs,
                    align: "left"
                  })
                  dispatch(tr)
                } else {
                  toast.info("Por favor selecciona una imagen primero.")
                }
              })
            }
            title="Alinear a la Izquierda"
          >
            <AlignLeft className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </ToolbarButton>
          <ToolbarButton
            disabled={!editable}
            onClick={() =>
              runCommand((view) => {
                const { state, dispatch } = view
                const { selection } = state
                const nodeSelection = selection as any
                
                if (nodeSelection.node && nodeSelection.node.type.name === "image") {
                  const tr = state.tr.setNodeMarkup(selection.from, null, {
                    ...nodeSelection.node.attrs,
                    align: "center"
                  })
                  dispatch(tr)
                } else {
                  toast.info("Por favor selecciona una imagen primero.")
                }
              })
            }
            title="Centrar"
          >
            <AlignCenter className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </ToolbarButton>
          <ToolbarButton
            disabled={!editable}
            onClick={() =>
              runCommand((view) => {
                const { state, dispatch } = view
                const { selection } = state
                const nodeSelection = selection as any
                
                if (nodeSelection.node && nodeSelection.node.type.name === "image") {
                  const tr = state.tr.setNodeMarkup(selection.from, null, {
                    ...nodeSelection.node.attrs,
                    align: "right"
                  })
                  dispatch(tr)
                } else {
                  toast.info("Por favor selecciona una imagen primero.")
                }
              })
            }
            title="Alinear a la Derecha"
          >
            <AlignRight className="h-4 w-4 text-gray-700 dark:text-gray-300" />
          </ToolbarButton>
          </div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {statusLabel(status, accessRole)}
          </div>
        </div>
      </div>
      <div className="document-page-workspace">
        <div
          className="document-page-stack"
          aria-hidden="true"
          style={{ ["--document-page-count" as string]: pageCount }}
        >
          {Array.from({ length: pageCount }, (_, index) => (
            <div key={index} className="document-page-sheet">
              <span className="document-page-number">{index + 1}</span>
            </div>
          ))}
        </div>
        <div ref={editorContainerRef} className="document-editor-container relative z-10" />
      </div>
      
      <EaDiagramModal 
        isOpen={isEaModalOpen} 
        onClose={() => setIsEaModalOpen(false)} 
        onGenerate={(imageUrl) => {
          runCommand((view) => {
            const { state, dispatch } = view
            const imageNode = documentSchema.nodes.image.create({ src: imageUrl, alt: "Diagrama EA" })
            const tr = state.tr.replaceSelectionWith(imageNode)
            dispatch(tr)
          })
        }}
      />
    </div>
  )
}

function ToolbarButton({
  children,
  onClick,
  disabled,
  title
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  title?: string
}) {
  return (
    <Button type="button" variant="ghost" size="icon" onClick={onClick} disabled={disabled} title={title} className="h-8 w-8">
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

