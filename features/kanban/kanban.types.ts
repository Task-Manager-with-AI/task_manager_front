export const KANBAN_COLUMN_COLORS = [
  "blue",
  "violet",
  "emerald",
  "amber",
  "rose",
  "slate",
] as const

export type KanbanColumnColor = (typeof KANBAN_COLUMN_COLORS)[number]

export interface KanbanColumn {
  id: string
  projectId: string
  title: string
  position: number
  color: KanbanColumnColor | null
  taskCount: number
  createdAt: string
  updatedAt: string
}

export interface KanbanColumnInput {
  id?: string
  title: string
  color?: KanbanColumnColor | null
}

export interface UpdateKanbanLayoutDto {
  columns: KanbanColumnInput[]
}

export const COLUMN_COLOR_STYLES: Record<
  KanbanColumnColor,
  { header: string; badge: string; dot: string; drop: string }
> = {
  blue: {
    header: "border-t-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    dot: "bg-blue-500",
    drop: "bg-blue-50/80 dark:bg-blue-950/30 ring-blue-300 dark:ring-blue-700",
  },
  violet: {
    header: "border-t-violet-500",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    dot: "bg-violet-500",
    drop: "bg-violet-50/80 dark:bg-violet-950/30 ring-violet-300 dark:ring-violet-700",
  },
  emerald: {
    header: "border-t-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    dot: "bg-emerald-500",
    drop: "bg-emerald-50/80 dark:bg-emerald-950/30 ring-emerald-300 dark:ring-emerald-700",
  },
  amber: {
    header: "border-t-amber-500",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    dot: "bg-amber-500",
    drop: "bg-amber-50/80 dark:bg-amber-950/30 ring-amber-300 dark:ring-amber-700",
  },
  rose: {
    header: "border-t-rose-500",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    dot: "bg-rose-500",
    drop: "bg-rose-50/80 dark:bg-rose-950/30 ring-rose-300 dark:ring-rose-700",
  },
  slate: {
    header: "border-t-slate-500",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
    dot: "bg-slate-500",
    drop: "bg-slate-50/80 dark:bg-slate-950/30 ring-slate-300 dark:ring-slate-700",
  },
}

export function isKanbanColumnColor(
  color: string | null | undefined
): color is KanbanColumnColor {
  return (
    color != null &&
    (KANBAN_COLUMN_COLORS as readonly string[]).includes(color)
  )
}

export function getColumnStyles(color: KanbanColumnColor | string | null | undefined) {
  if (isKanbanColumnColor(color)) {
    return COLUMN_COLOR_STYLES[color]
  }
  return COLUMN_COLOR_STYLES.slate
}
