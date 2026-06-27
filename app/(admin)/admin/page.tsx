"use client"

import {
  Users,
  FolderKanban,
  CheckSquare,
  Star,
  TrendingUp,
  MessageSquare,
  FileText,
  Video,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminMetrics, useAdminFeedbackStats } from "@/features/admin/admin.hooks"

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="flex items-start gap-4 pt-5 pb-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent ?? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

const PIE_COLORS = ["#3b82f6", "#f59e0b"]
const STAR_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"]

export default function AdminMetricsPage() {
  const { data: metrics, isLoading } = useAdminMetrics()
  const { data: feedbackStats } = useAdminFeedbackStats()

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-xl" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const regData = metrics.registrationsByDay.map((r) => ({
    date: r.date.slice(5),
    registros: r.count,
  }))

  const distData = [5, 4, 3, 2, 1].map((s) => ({
    stars: `${s}★`,
    cantidad: feedbackStats?.distribution?.[String(s)] ?? 0,
  }))

  const providerData = [
    { name: "Email", value: metrics.users.byProvider.email },
    { name: "Google", value: metrics.users.byProvider.google },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
          Métricas de plataforma
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          Vista global del sistema en tiempo real
        </p>
      </div>

      {/* KPI Cards — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Usuarios"
          value={metrics.users.total}
          sub={`+${metrics.users.newLast7Days} esta semana`}
        />
        <KpiCard
          icon={FolderKanban}
          label="Proyectos activos"
          value={metrics.projects.active}
          sub={`${metrics.projects.total} en total`}
          accent="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <KpiCard
          icon={CheckSquare}
          label="Tareas"
          value={metrics.tasks.total}
          sub={`${metrics.tasks.completed} completadas`}
          accent="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        />
        <KpiCard
          icon={Star}
          label="Rating promedio"
          value={metrics.feedback.count > 0 ? `${metrics.feedback.averageRating.toFixed(1)} ★` : "—"}
          sub={`${metrics.feedback.count} valoraciones`}
          accent="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        />
      </div>

      {/* Registros por día */}
      <Card className="border-border/60">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="h-4 w-4 text-amber-500 shrink-0" />
            Registros por día — últimos 30 días
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {regData.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Sin datos aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={regData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="registros" stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#f59e0b" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bottom row — stack on mobile, 3 cols on lg */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Distribución de calificaciones */}
        <Card className="border-border/60">
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm font-semibold">Distribución de valoraciones</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {metrics.feedback.count === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">Sin valoraciones aún</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={distData} layout="vertical" margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={10} />
                  <YAxis type="category" dataKey="stars" tickLine={false} axisLine={false} fontSize={10} width={28} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                    {distData.map((_, i) => <Cell key={i} fill={STAR_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Proveedores de auth */}
        <Card className="border-border/60">
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm font-semibold">Proveedores de autenticación</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={providerData} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value">
                  {providerData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Métricas adicionales */}
        <Card className="border-border/60 sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm font-semibold">Actividad de la plataforma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-1 px-4 sm:px-6">
            {[
              { icon: Video, label: "Reuniones", value: metrics.meetings.total, sub: `${metrics.meetings.withMinutes} con minutas` },
              { icon: FileText, label: "Documentos", value: metrics.documents.total },
              { icon: MessageSquare, label: "Mensajes", value: metrics.chats.totalMessages.toLocaleString() },
              { icon: Users, label: "Chats directos", value: metrics.chats.directChats },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-gray-500">
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                  {item.sub && <p className="text-xs text-gray-400 dark:text-gray-500">{item.sub}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
