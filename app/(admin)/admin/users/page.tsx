"use client"

import { useState } from "react"
import {
  Search,
  MoreHorizontal,
  UserCheck,
  UserX,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminUsers, usePatchAdminUser, useAdminRoles } from "@/features/admin/admin.hooks"
import { chatsApi } from "@/features/chats/chats.api"
import type { AdminUser } from "@/features/admin/admin.types"

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MEMBER: "Miembro",
  GUEST: "Invitado",
}

function RoleBadge({ name }: { name: string }) {
  const colors: Record<string, string> = {
    SUPER_ADMIN: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    MEMBER: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    GUEST: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[name] ?? colors.GUEST}`}>
      {ROLE_LABELS[name] ?? name}
    </span>
  )
}

function UserActions({
  user,
  roles,
  onPatch,
}: {
  user: AdminUser
  roles: Array<{ id: number; name: string }>
  onPatch: (id: string, data: { isActive?: boolean; roleId?: number }) => void
}) {
  const router = useRouter()
  const isSuperAdmin = user.role.name === "SUPER_ADMIN"

  async function handleOpenChat() {
    try {
      const chat = await chatsApi.direct(user.id)
      router.push(`/admin/support?chatId=${chat.id}`)
    } catch { /* ignore */ }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isSuperAdmin}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onPatch(user.id, { isActive: !user.isActive })}>
          {user.isActive
            ? <><UserX className="mr-2 h-4 w-4 text-red-500" />Desactivar cuenta</>
            : <><UserCheck className="mr-2 h-4 w-4 text-green-500" />Activar cuenta</>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-gray-500">Cambiar rol</DropdownMenuLabel>
        {roles.map((role) => (
          <DropdownMenuItem
            key={role.id}
            disabled={user.role.name === role.name}
            onClick={() => onPatch(user.id, { roleId: role.id })}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            {ROLE_LABELS[role.name] ?? role.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleOpenChat}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Abrir chat de soporte
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* Mobile card for a single user */
function UserCard({
  user,
  roles,
  onPatch,
}: {
  user: AdminUser
  roles: Array<{ id: number; name: string }>
  onPatch: (id: string, data: { isActive?: boolean; roleId?: number }) => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4">
      <div className="min-w-0 space-y-1">
        <p className="truncate font-medium text-sm text-gray-900 dark:text-white">{user.name}</p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <RoleBadge name={user.role.name} />
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.isActive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-500"}`} />
            {user.isActive ? "Activo" : "Inactivo"}
          </span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {user._count.memberships} proyectos · {user._count.tasksOwned} tareas
        </p>
      </div>
      <UserActions user={user} roles={roles} onPatch={onPatch} />
    </div>
  )
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("all")
  const [isActive, setIsActive] = useState("all")
  const [page, setPage] = useState(1)

  const { data: rolesData } = useAdminRoles()
  const roles = rolesData ?? []

  const { data, isLoading } = useAdminUsers({
    page,
    limit: 20,
    search: search || undefined,
    role: role !== "all" ? role : undefined,
    isActive: isActive !== "all" ? isActive : undefined,
  })

  const { mutate: patchUser } = usePatchAdminUser()
  const handlePatch = (id: string, patch: { isActive?: boolean; roleId?: number }) =>
    patchUser({ id, data: patch })

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Usuarios del sistema</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {data ? `${data.total} usuarios en total` : "Cargando…"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre o email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-8 h-9 w-full"
          />
        </div>
        <div className="flex gap-2">
          <Select value={role} onValueChange={(v) => { setRole(v); setPage(1) }}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MEMBER">Miembro</SelectItem>
              <SelectItem value="GUEST">Invitado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={isActive} onValueChange={(v) => { setIsActive(v); setPage(1) }}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 sm:hidden">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
          : data?.users.length === 0
            ? <p className="py-10 text-center text-sm text-gray-400">No se encontraron usuarios</p>
            : data?.users.map((user) => (
                <UserCard key={user.id} user={user} roles={roles} onPatch={handlePatch} />
              ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden md:table-cell">Registro</TableHead>
              <TableHead className="hidden lg:table-cell">Actividad</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : data?.users.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-gray-400">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                )
                : data?.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell><RoleBadge name={user.role.name} /></TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.isActive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-500"}`} />
                        {user.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-gray-500 dark:text-gray-400">
                      {user._count.memberships} proyectos · {user._count.tasksOwned} tareas
                    </TableCell>
                    <TableCell>
                      <UserActions user={user} roles={roles} onPatch={handlePatch} />
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
