"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { useTranslation } from "@/components/locale-provider"
import type { BurnupData } from "./dashboard.types"

interface Props {
  data: BurnupData | null
}

export function BurnupChart({ data }: Props) {
  const { t } = useTranslation()

  const chartConfig = {
    total: { label: t("dashboard.charts.scope"), color: "hsl(var(--muted-foreground))" },
    done: { label: t("dashboard.charts.completed"), color: "hsl(142 76% 36%)" },
  }

  if (!data) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.charts.burnup")}</CardTitle>
          <CardDescription>{t("dashboard.charts.noActiveSprint")}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const merged = data.scope.map((point, i) => ({
    date: point.date.slice(5),
    total: point.total,
    done: data.completed[i]?.done ?? 0,
  }))

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("dashboard.charts.burnup")}</CardTitle>
        <CardDescription>{t("dashboard.charts.burnupDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-[4/3] min-h-[220px] w-full @lg:aspect-video" aria-label={t("dashboard.charts.burnupAria")}>
          <LineChart data={merged} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={11} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeDasharray="4 4" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="done" stroke="var(--color-done)" dot={false} strokeWidth={2.5} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
