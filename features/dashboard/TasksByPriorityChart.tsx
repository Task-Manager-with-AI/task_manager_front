"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useTranslation } from "@/components/locale-provider"

interface Props {
  data: Array<{ priority: string; count: number }>
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#22c55e",
}

export function TasksByPriorityChart({ data }: Props) {
  const { t } = useTranslation()

  const chartData = data.map((d) => ({
    priority: t(`dashboard.priority.${d.priority.toLowerCase()}`),
    count: d.count,
    fill: PRIORITY_COLORS[d.priority] ?? "#94a3b8",
  }))

  const chartConfig = { count: { label: t("dashboard.charts.tasks"), color: "hsl(var(--primary))" } }

  if (chartData.length === 0) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.charts.byPriority")}</CardTitle>
          <CardDescription>{t("dashboard.charts.noData")}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("dashboard.charts.byPriority")}</CardTitle>
        <CardDescription>{t("dashboard.charts.byPriorityDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-[4/3] min-h-[220px] w-full @lg:aspect-video" aria-label={t("dashboard.charts.byPriorityAria")}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis type="category" dataKey="priority" tickLine={false} axisLine={false} width={72} fontSize={11} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={22} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
