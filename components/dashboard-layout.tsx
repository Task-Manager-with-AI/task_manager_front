"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTranslation } from "@/components/locale-provider"
import {
  Search,
  Plus,
  Bell,
  BarChart3,
  MessageSquare,
  FileText,
  Receipt,
  Settings,
  HelpCircle,
  User,
  LogOut,
  CheckCircle,
  Users,
  Video,
  KanbanSquare,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Menu,
  X,
} from "lucide-react"
import { useCreateProject } from "@/features/projects/projects.hooks"
import { useCurrentUser, useLogout } from "@/features/auth/auth.hooks"

interface Project {
  id: string
  name: string
  color: string
}

interface DashboardLayoutProps {
  children: React.ReactNode
  projects: Project[]
}

type SubItem = {
  key: string
  icon: React.FC<{ className?: string }>
  getPath: (projectId: string) => string
  isActiveFn: (pathname: string, projectId: string) => boolean
}

const PROJECT_SUB_ITEMS: SubItem[] = [
  {
    key: "nav.projectTasks",
    icon: CheckCircle,
    getPath: (id) => `/projects/${id}`,
    isActiveFn: (p, id) => p === `/projects/${id}`,
  },
  {
    key: "nav.kanban",
    icon: KanbanSquare,
    getPath: (id) => `/projects/${id}/kanban`,
    isActiveFn: (p, id) => p.startsWith(`/projects/${id}/kanban`),
  },
  {
    key: "nav.meetings",
    icon: Video,
    getPath: (id) => `/projects/${id}/meetings`,
    isActiveFn: (p, id) => p.startsWith(`/projects/${id}/meetings`),
  },
  {
    key: "nav.documents",
    icon: FileText,
    getPath: () => `/documents`,
    isActiveFn: (p) => p.startsWith("/documents"),
  },
  {
    key: "nav.receipts",
    icon: Receipt,
    getPath: () => `/receipts`,
    isActiveFn: (p) => p.startsWith("/receipts"),
  },
]

export default function DashboardLayout({ children, projects }: DashboardLayoutProps) {
  const { t } = useTranslation()
  const { mutate: createProject } = useCreateProject()
  const { data: currentUser } = useCurrentUser()
  const { mutate: logout, isPending: isLoggingOut } = useLogout()
  const router = useRouter()
  const pathname = usePathname()

  const [newProjectName, setNewProjectName] = useState("")
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const activeProjectId = useMemo(() => {
    const match = pathname.match(/^\/projects\/([^/]+)/)
    return match ? match[1] : null
  }, [pathname])

  useEffect(() => {
    if (activeProjectId) {
      setExpandedProjectId(activeProjectId)
    }
  }, [activeProjectId])

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [pathname])

  const currentUserName = currentUser?.name ?? t("common.user")
  const currentUserEmail = currentUser?.email ?? t("common.signedIn")
  const currentUserInitials = currentUserName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const topNavItems = [
    { name: t("nav.dashboard"), icon: BarChart3, path: "/dashboard" },
    { name: t("nav.projects"),  icon: FolderOpen, path: "/projects" },
    { name: t("nav.people"),    icon: Users,     path: "/people" },
    { name: t("nav.chats"),     icon: MessageSquare, path: "/chats" },
  ]

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return projects
    return projects.filter((p) => p.name.toLowerCase().includes(query))
  }, [projects, searchQuery])

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return
    const match = filteredProjects[0]
    router.push(match ? `/projects/${match.id}` : "/projects")
  }

  const handleAddProject = () => {
    if (!newProjectName.trim()) return
    createProject(
      { name: newProjectName.trim() },
      {
        onSuccess: () => {
          setNewProjectName("")
          setIsProjectDialogOpen(false)
        },
      }
    )
  }

  const toggleProject = (projectId: string) => {
    setExpandedProjectId((prev) => (prev === projectId ? null : projectId))
  }

  const isTopNavActive = (path: string) => pathname === path

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="flex h-14 items-center justify-between px-5 border-b border-gray-100 dark:border-gray-700">
        <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
          {t("brand.name")}
        </h1>
        {/* Close button — only visible on mobile */}
        <button
          className="lg:hidden -mr-2 rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Global nav */}
        <nav className="px-3 pt-4 pb-2">
          {topNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`mb-0.5 flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isTopNavActive(item.path)
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60"
              }`}
            >
              <item.icon className="mr-2.5 h-4 w-4 shrink-0" />
              {item.name}
            </button>
          ))}
        </nav>

        <Separator className="mx-3 bg-gray-100 dark:bg-gray-700" />

        {/* Projects section */}
        <div className="flex-1 px-3 pt-3 pb-2">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {t("nav.projectsSection")}
            </span>
            <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  aria-label={t("nav.addProject")}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-white">
                    {t("common.addNewProject")}
                  </DialogTitle>
                  <DialogDescription>{t("projects.createDescription")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="project-name" className="text-gray-700 dark:text-gray-300">
                      {t("common.projectName")}
                    </Label>
                    <Input
                      id="project-name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder={t("common.enterProjectName")}
                      className="border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      onKeyDown={(e) => e.key === "Enter" && handleAddProject()}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>
                      {t("common.cancel")}
                    </Button>
                    <Button onClick={handleAddProject}>{t("common.addProject")}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Project list */}
          <div className="space-y-0.5">
            {filteredProjects.map((project) => {
              const isExpanded = expandedProjectId === project.id
              const isActive = activeProjectId === project.id

              return (
                <div key={project.id}>
                  <div
                    className={`group flex w-full items-center rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700/60"
                    }`}
                  >
                    <button
                      aria-label={isExpanded ? "Colapsar proyecto" : "Expandir proyecto"}
                      onClick={() => toggleProject(project.id)}
                      className="flex h-9 w-7 shrink-0 items-center justify-center rounded text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        router.push(`/projects/${project.id}`)
                        setExpandedProjectId(project.id)
                      }}
                      className="flex flex-1 items-center gap-2 overflow-hidden py-1.5 pr-2 text-left"
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${project.color}`} />
                      <span
                        className={`truncate text-sm font-medium ${
                          isActive
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {project.name}
                      </span>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="ml-6 mt-0.5 space-y-0.5 border-l border-gray-200 pl-2 dark:border-gray-700">
                      {PROJECT_SUB_ITEMS.map(({ key, icon: Icon, getPath, isActiveFn }) => {
                        const active = isActiveFn(pathname, project.id)
                        const path = getPath(project.id)
                        return (
                          <button
                            key={key}
                            onClick={() => router.push(path)}
                            className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs font-medium transition-colors ${
                              active
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                                : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700/60 dark:hover:text-gray-200"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            {t(key)}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {filteredProjects.length === 0 && (
              <p className="px-2 py-3 text-xs text-gray-400 dark:text-gray-500">
                {t("common.noResults")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-3 py-3 dark:border-gray-700">
        <button
          onClick={() => router.push("/settings")}
          className={`mb-0.5 flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/60 ${
            pathname === "/settings" ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200" : ""
          }`}
        >
          <Settings className="mr-2.5 h-4 w-4" />
          {t("nav.settings")}
        </button>
        <button
          onClick={() => router.push("/help")}
          className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/60 ${
            pathname === "/help" ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200" : ""
          }`}
        >
          <HelpCircle className="mr-2.5 h-4 w-4" />
          {t("nav.helpSupport")}
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-dvh bg-gray-50 dark:bg-gray-900">
      {/* ── Mobile backdrop overlay ─────────────────────── */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      {/* Mobile: fixed slide-in overlay; Desktop: static column */}
      <aside
        className={[
          "flex flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
          // Desktop: static, always visible
          "lg:static lg:w-64 lg:shrink-0 lg:translate-x-0",
          // Mobile: fixed overlay with smooth slide
          "fixed inset-y-0 left-0 z-30 w-72 transition-transform duration-300 ease-in-out",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-label="Navegación principal"
      >
        <SidebarContent />
      </aside>

      {/* ── Main area ────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800 sm:px-5 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Left: hamburger (mobile) + search (tablet+) */}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {/* Hamburger — only on mobile */}
              <button
                className="flex-shrink-0 rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 lg:hidden"
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Abrir menú de navegación"
                aria-expanded={isMobileSidebarOpen}
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Search bar — hidden on mobile, shown from sm */}
              <div className="relative hidden flex-1 sm:block sm:max-w-xs md:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <Input
                  aria-label={t("common.search")}
                  placeholder={t("common.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full border-gray-300 bg-white pl-10 text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Right actions */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
              {/* "New Project" — full label on md+, icon-only on smaller */}
              <Button
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                onClick={() => setIsProjectDialogOpen(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">{t("common.newProject")}</span>
              </Button>

              <ThemeToggle />

              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={t("common.openNotifications")}>
                    <Bell className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-72 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 sm:w-80"
                  align="end"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {t("common.notifications")}
                      </h3>
                    </div>
                    <Separator className="bg-gray-200 dark:bg-gray-700" />
                    <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      {t("common.noNotifications")}
                    </p>
                  </div>
                </PopoverContent>
              </Popover>

              {/* User menu */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label={t("common.openAccountMenu")}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white">
                        {currentUserInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-60 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 sm:w-64"
                  align="end"
                >
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                        <AvatarFallback className="bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white">
                          {currentUserInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900 dark:text-white">{currentUserName}</p>
                        <p className="truncate text-sm text-gray-600 dark:text-gray-300">{currentUserEmail}</p>
                      </div>
                    </div>
                    <Separator className="bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        onClick={() => router.push("/settings")}
                      >
                        <User className="mr-2 h-4 w-4" />
                        {t("common.profileSettings")}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        onClick={() => router.push("/settings")}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        {t("common.accountSettings")}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        onClick={() => router.push("/help")}
                      >
                        <HelpCircle className="mr-2 h-4 w-4" />
                        {t("nav.helpSupport")}
                      </Button>
                    </div>
                    <Separator className="bg-gray-200 dark:bg-gray-700" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                      disabled={isLoggingOut}
                      onClick={() => logout()}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {isLoggingOut ? t("common.signingOut") : t("common.signOut")}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">{children}</div>
      </div>
    </div>
  )
}
