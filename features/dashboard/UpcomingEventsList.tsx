"use client"

import Link from "next/link"
import { CalendarClock, CheckSquare, Flag, Video } from "lucide-react"
import { useTranslation } from "@/components/locale-provider"
import type { CalendarEvent } from "./dashboard.types"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"

interface Props {
  events: CalendarEvent[]
  selectedDate?: Date
  maxItems?: number
}

const TYPE_STYLES = {
  TASK_DUE: { icon: CheckSquare, dot: "bg-amber-500", label: "taskDue" },
  MEETING: { icon: Video, dot: "bg-blue-500", label: "meeting" },
  SPRINT_END: { icon: Flag, dot: "bg-violet-500", label: "sprintEnd" },
} as const

function eventHref(event: CalendarEvent): string {
  if (event.type === "MEETING") {
    return `/projects/${event.projectId}/meetings/${event.id}`
  }
  return `/projects/${event.projectId}`
}

export function UpcomingEventsList({ events, selectedDate, maxItems = 15 }: Props) {
  const { t } = useTranslation()

  const filtered = selectedDate
    ? events.filter((e) => e.date === format(selectedDate, "yyyy-MM-dd"))
    : events

  const sorted = [...filtered]
    .sort((a, b) => (a.datetime ?? a.date).localeCompare(b.datetime ?? b.date))
    .slice(0, maxItems)

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
        <CalendarClock className="h-8 w-8 opacity-40" />
        <p>{selectedDate ? t("dashboard.calendar.noEventsDay") : t("dashboard.calendar.noEvents")}</p>
      </div>
    )
  }

  return (
    <ul className="space-y-1">
      {sorted.map((event) => {
        const style = TYPE_STYLES[event.type]
        const Icon = style.icon
        const when = event.datetime
          ? format(parseISO(event.datetime), "d MMM · HH:mm")
          : format(parseISO(event.date), "d MMM")

        return (
          <li key={`${event.type}-${event.id}`}>
            <Link
              href={eventHref(event)}
              className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/60"
            >
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", style.dot)} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium group-hover:text-primary">{event.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  <Icon className="h-3 w-3" aria-hidden />
                  <span>{t(`dashboard.eventTypes.${style.label}`)}</span>
                  <span>·</span>
                  <span>{when}</span>
                </p>
                <p className="truncate text-[11px] text-muted-foreground/80">{event.projectName}</p>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
