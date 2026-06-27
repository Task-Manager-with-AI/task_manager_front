"use client"

import { useState } from "react"
import { Star, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminFeedback, useAdminFeedbackStats } from "@/features/admin/admin.hooks"

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "fill-none text-gray-200 dark:text-gray-700"}`} />
      ))}
    </span>
  )
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 text-right text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-xs font-medium text-gray-700 dark:text-gray-300">{value}</span>
    </div>
  )
}

const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard", kanban: "Kanban", meetings: "Reuniones",
  documents: "Documentos", chats: "Chats", copilot: "Copiloto", other: "Otro",
}

export default function AdminFeedbackPage() {
  const [ratingFilter, setRatingFilter] = useState("all")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAdminFeedback({
    page, limit: 20,
    rating: ratingFilter !== "all" ? Number(ratingFilter) : undefined,
    from: from || undefined,
    to: to || undefined,
  })
  const { data: stats } = useAdminFeedbackStats()
  const maxDist = stats ? Math.max(...Object.values(stats.distribution)) : 1

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Feedback de usuarios</h1>
        {stats && (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Promedio: <span className="font-semibold text-amber-500">{stats.average.toFixed(1)} ★</span> · {stats.count} valoraciones
          </p>
        )}
      </div>

      {/* Distribución */}
      {stats && stats.count > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Distribución</p>
            {[5, 4, 3, 2, 1].map((s) => (
              <StatBar
                key={s} label={`${s}★`}
                value={stats.distribution[String(s)] ?? 0}
                max={maxDist}
                color={s >= 4 ? "bg-green-500" : s === 3 ? "bg-amber-400" : "bg-red-400"}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400 shrink-0" />
          <Select value={ratingFilter} onValueChange={(v) => { setRatingFilter(v); setPage(1) }}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las estrellas</SelectItem>
              {[5, 4, 3, 2, 1].map((s) => (
                <SelectItem key={s} value={String(s)}>{s} estrella{s > 1 ? "s" : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} className="h-9 w-36 sm:w-40" />
          <span className="text-sm text-gray-400">—</span>
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} className="h-9 w-36 sm:w-40" />
          {(ratingFilter !== "all" || from || to) && (
            <Button variant="ghost" size="sm" onClick={() => { setRatingFilter("all"); setFrom(""); setTo(""); setPage(1) }}>
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 sm:hidden">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
          : data?.feedback.length === 0
            ? <p className="py-10 text-center text-sm text-gray-400">No hay valoraciones</p>
            : data?.feedback.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.user.name}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{item.user.email}</p>
                  </div>
                  <StarRating rating={item.rating} />
                </div>
                {item.comment && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{item.comment}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400">
                    {PAGE_LABELS[item.page ?? ""] ?? item.page ?? "—"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Usuario</TableHead>
              <TableHead>Valoración</TableHead>
              <TableHead>Comentario</TableHead>
              <TableHead className="hidden md:table-cell">Página</TableHead>
              <TableHead className="whitespace-nowrap">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : data?.feedback.length === 0
                ? <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-gray-400">No hay valoraciones</TableCell></TableRow>
                : data?.feedback.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.user.email}</p>
                    </TableCell>
                    <TableCell><StarRating rating={item.rating} /></TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm text-gray-600 dark:text-gray-400">
                        {item.comment ?? <span className="italic text-gray-300 dark:text-gray-600">Sin comentario</span>}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400">
                        {PAGE_LABELS[item.page ?? ""] ?? item.page ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Página {data.page} de {data.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
