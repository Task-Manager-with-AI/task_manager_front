"use client"

import { useMemo, useState } from "react"
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "@/components/locale-provider"
import { useDashboardCalendar } from "./dashboard.hooks"
import { UpcomingEventsList } from "./UpcomingEventsList"
import type { CalendarEvent } from "./dashboard.types"
import { cn } from "@/lib/utils"

interface Props {
  projectId?: string
}

function buildEventDays(events: CalendarEvent[]) {
  const taskDays: Date[] = []
  const meetingDays: Date[] = []
  const sprintDays: Date[] = []

  for (const e of events) {
    const day = new Date(e.date + "T12:00:00")
    if (e.type === "TASK_DUE") taskDays.push(day)
    else if (e.type === "MEETING") meetingDays.push(day)
    else sprintDays.push(day)
  }

  return { taskDays, meetingDays, sprintDays }
}

export function DashboardCalendarPanel({ projectId }: Props) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<Date | undefined>(undefined)
  const [month, setMonth] = useState<Date>(new Date())

  const from = format(startOfMonth(addMonths(month, -1)), "yyyy-MM-dd")
  const to = format(endOfMonth(addMonths(month, 1)), "yyyy-MM-dd")

  const { data, isLoading } = useDashboardCalendar(from, to, projectId)
  const events = data?.events ?? []

  const { taskDays, meetingDays, sprintDays } = useMemo(
    () => buildEventDays(events),
    [events]
  )

  return (
    <Card className="border-border/60 lg:sticky lg:top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("dashboard.calendar.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-[280px] w-full rounded-lg" />
        ) : (
          <Calendar
            mode="single"
            selected={selected}
            onSelect={setSelected}
            month={month}
            onMonthChange={setMonth}
            className="w-full rounded-lg border border-border/50"
            modifiers={{ taskDue: taskDays, meeting: meetingDays, sprintEnd: sprintDays }}
            modifiersClassNames={{
              taskDue: "[&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:h-1 [&>button]:after:w-1 [&>button]:after:rounded-full [&>button]:after:bg-amber-500",
              meeting: "[&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:h-1 [&>button]:after:w-1 [&>button]:after:rounded-full [&>button]:after:bg-blue-500",
              sprintEnd: "[&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:h-1 [&>button]:after:w-1 [&>button]:after:rounded-full [&>button]:after:bg-violet-500",
            }}
          />
        )}

        <div className="flex flex-wrap gap-3 border-t border-border/50 pt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full bg-amber-500")} />
            {t("dashboard.eventTypes.taskDue")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full bg-blue-500")} />
            {t("dashboard.eventTypes.meeting")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full bg-violet-500")} />
            {t("dashboard.eventTypes.sprintEnd")}
          </span>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium">
            {selected
              ? t("dashboard.calendar.eventsOn").replace("{date}", format(selected, "d MMM"))
              : t("dashboard.calendar.upcoming")}
          </h3>
          <UpcomingEventsList events={events} selectedDate={selected} />
        </div>
      </CardContent>
    </Card>
  )
}
