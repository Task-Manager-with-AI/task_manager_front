"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { useTranslation } from "@/components/locale-provider"
import type { BurndownData } from "./dashboard.types"

interface Props {
  data: BurndownData | null
}

export function BurndownChart({ data }: Props) {
  const { t } = useTranslation()

  const chartConfig = {
    ideal: { label: t("dashboard.charts.ideal"), color: "hsl(var(--muted-foreground))" },
    actual: { label: t("dashboard.charts.actual"), color: "hsl(var(--primary))" },
  }

  if (!data) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.charts.burndown")}</CardTitle>
          <CardDescription>{t("dashboard.charts.noActiveSprint")}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const merged = data.ideal.map((point, i) => ({
    date: point.date.slice(5),
    ideal: point.remaining,
    actual: data.actual[i]?.remaining ?? 0,
  }))

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("dashboard.charts.burndown")}</CardTitle>
        <CardDescription>
          {data.sprint.name} · {t(`dashboard.unit.${data.unit}`)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-[4/3] min-h-[220px] w-full @lg:aspect-video" aria-label={t("dashboard.charts.burndownAria")}>
          <LineChart data={merged} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={11} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line type="monotone" dataKey="ideal" stroke="var(--color-ideal)" strokeDasharray="4 4" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="actual" stroke="var(--color-actual)" dot={false} strokeWidth={2.5} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
