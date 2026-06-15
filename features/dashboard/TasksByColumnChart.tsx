"use client"

import { Pie, PieChart, Cell, Label } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useTranslation } from "@/components/locale-provider"

interface Props {
  data: Array<{ column: string; count: number; color?: string }>
}

const FALLBACK_COLORS = ["#94a3b8", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7"]

export function TasksByColumnChart({ data }: Props) {
  const { t } = useTranslation()

  const chartConfig = Object.fromEntries(
    data.map((d, i) => [
      d.column,
      { label: d.column, color: d.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length] },
    ])
  )

  const total = data.reduce((s, d) => s + d.count, 0)

  if (total === 0) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.charts.byColumn")}</CardTitle>
          <CardDescription>{t("dashboard.charts.noData")}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("dashboard.charts.byColumn")}</CardTitle>
        <CardDescription>{t("dashboard.charts.byColumnDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[260px] w-full" aria-label={t("dashboard.charts.byColumnAria")}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey="count" nameKey="column" innerRadius={56} outerRadius={88} paddingAngle={2}>
              {data.map((entry, i) => (
                <Cell key={entry.column} fill={entry.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                          {total}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 18} className="fill-muted-foreground text-xs">
                          {t("dashboard.charts.totalTasks")}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
