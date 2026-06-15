"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useTranslation } from "@/components/locale-provider"

interface Props {
  data: Array<{ weekLabel: string; completed: number }>
}

export function WeeklyVelocityChart({ data }: Props) {
  const { t } = useTranslation()

  const config = {
    completed: { label: t("dashboard.charts.completed"), color: "hsl(var(--primary))" },
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("dashboard.charts.velocity")}</CardTitle>
        <CardDescription>{t("dashboard.charts.velocityDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-[3/1] min-h-[180px] w-full" aria-label={t("dashboard.charts.velocityAria")}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="weekLabel" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={11} width={28} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
