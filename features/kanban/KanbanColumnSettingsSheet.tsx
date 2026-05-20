"use client"

import { useEffect, useRef, useState } from "react"
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "@/components/locale-provider"
import { useUpdateKanbanLayout } from "./kanban.hooks"
import type { KanbanColumn, KanbanColumnColor, KanbanColumnInput } from "./kanban.types"
import { KANBAN_COLUMN_COLORS, getColumnStyles } from "./kanban.types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface EditableColumn extends KanbanColumnInput {
  localKey: string
  taskCount?: number
}

function draftSignature(items: EditableColumn[]) {
  return JSON.stringify(
    items.map((c) => ({
      id: c.id ?? null,
      title: c.title.trim(),
      color: c.color ?? null,
    }))
  )
}

function colorLabelKey(color: KanbanColumnColor) {
  return `kanban.colors.${color}` as const
}

interface SortableColumnRowProps {
  column: EditableColumn
  onChange: (localKey: string, patch: Partial<EditableColumn>) => void
  onRemove: (localKey: string) => void
  canRemove: boolean
}

function SortableColumnRow({ column, onChange, onRemove, canRemove }: SortableColumnRowProps) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.localKey,
  })
  const styles = getColumnStyles(column.color ?? "slate")
  const color = column.color ?? "slate"

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-start gap-2 rounded-lg border bg-white p-3 dark:bg-slate-900",
        isDragging && "opacity-60 shadow-md",
        "border-slate-200 dark:border-slate-700"
      )}
    >
      <button
        type="button"
        className="mt-2 cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        aria-label={t("kanban.dragColumn")}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1 space-y-2">
        <Input
          value={column.title}
          onChange={(e) => onChange(column.localKey, { title: e.target.value })}
          placeholder={t("kanban.columnTitlePlaceholder")}
          maxLength={40}
        />
        <Select
          value={color}
          onValueChange={(value) =>
            onChange(column.localKey, { color: value as KanbanColumnColor })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KANBAN_COLUMN_COLORS.map((c) => (
              <SelectItem key={c} value={c}>
                <span className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", getColumnStyles(c).dot)} />
                  {t(colorLabelKey(c))}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(column.taskCount ?? 0) > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {t("kanban.columnHasTasks").replace("{count}", String(column.taskCount))}
          </p>
        )}
      </div>
      <span className={cn("mt-2 h-1 w-8 shrink-0 rounded-full", styles.dot)} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 text-red-600 hover:text-red-700"
        disabled={!canRemove}
        onClick={() => onRemove(column.localKey)}
        aria-label={t("kanban.removeColumn")}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface KanbanColumnSettingsSheetProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: KanbanColumn[]
}

export function KanbanColumnSettingsSheet({
  projectId,
  open,
  onOpenChange,
  columns,
}: KanbanColumnSettingsSheetProps) {
  const { t } = useTranslation()
  const updateLayout = useUpdateKanbanLayout(projectId)
  const [draft, setDraft] = useState<EditableColumn[]>([])
  const [baseline, setBaseline] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [discardOpen, setDiscardOpen] = useState(false)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const initial = columns.map((col) => ({
        localKey: col.id,
        id: col.id,
        title: col.title,
        color: col.color,
        taskCount: col.taskCount,
      }))
      setDraft(initial)
      setBaseline(draftSignature(initial))
      setError(null)
      updateLayout.reset()
    }
    wasOpenRef.current = open
  }, [open, columns, updateLayout])

  const isDirty = open && draftSignature(draft) !== baseline

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setDraft((items) => {
      const oldIndex = items.findIndex((i) => i.localKey === active.id)
      const newIndex = items.findIndex((i) => i.localKey === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  const handleAddColumn = () => {
    if (draft.length >= 8) return
    setDraft((items) => [
      ...items,
      {
        localKey: `new-${Date.now()}`,
        title: t("kanban.newColumnDefault"),
        color: "blue",
        taskCount: 0,
      },
    ])
  }

  const handleRemove = (localKey: string) => {
    const col = draft.find((c) => c.localKey === localKey)
    if (col && (col.taskCount ?? 0) > 0) {
      setError(t("kanban.cannotRemoveColumnWithTasks"))
      return
    }
    setDraft((items) => items.filter((i) => i.localKey !== localKey))
    setError(null)
  }

  const closeSheet = () => {
    setDiscardOpen(false)
    onOpenChange(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next && isDirty) {
      setDiscardOpen(true)
      return
    }
    if (!next) {
      closeSheet()
      return
    }
    onOpenChange(true)
  }

  const handleSave = () => {
    const trimmed = draft.map((c) => ({ ...c, title: c.title.trim() }))
    if (trimmed.some((c) => !c.title)) {
      setError(t("kanban.columnTitleRequired"))
      return
    }
    if (trimmed.length < 1) {
      setError(t("kanban.minOneColumn"))
      return
    }

    updateLayout.mutate(
      {
        columns: trimmed.map((c) => ({
          id: c.id,
          title: c.title,
          color: c.color ?? null,
        })),
      },
      {
        onSuccess: () => closeSheet(),
        onError: (err) => {
          setError(err instanceof Error ? err.message : t("common.somethingWrong"))
        },
      }
    )
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("kanban.configureBoard")}</SheetTitle>
            <SheetDescription>{t("kanban.configureBoardDescription")}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-3 overflow-y-auto py-4">
            {error && (
              <p
                className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
                role="alert"
              >
                {error}
              </p>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={draft.map((c) => c.localKey)}
                strategy={verticalListSortingStrategy}
              >
                {draft.map((column) => (
                  <SortableColumnRow
                    key={column.localKey}
                    column={column}
                    canRemove={draft.length > 1}
                    onChange={(localKey, patch) =>
                      setDraft((items) =>
                        items.map((i) => (i.localKey === localKey ? { ...i, ...patch } : i))
                      )
                    }
                    onRemove={handleRemove}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleAddColumn}
              disabled={draft.length >= 8}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("kanban.addColumn")}
            </Button>
          </div>

          <SheetFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={handleSave} disabled={updateLayout.isPending}>
              {updateLayout.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("kanban.discardChangesTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("kanban.discardChangesDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("kanban.keepEditing")}</AlertDialogCancel>
            <AlertDialogAction onClick={closeSheet}>{t("kanban.discardChanges")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
