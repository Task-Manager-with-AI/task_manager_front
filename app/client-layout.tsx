"use client"

import type React from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { useProjects } from "@/features/projects/projects.hooks"

const SIDEBAR_COLORS = [
  "bg-pink-200",
  "bg-green-200",
  "bg-blue-200",
  "bg-yellow-200",
  "bg-purple-200",
  "bg-red-200",
  "bg-orange-200",
  "bg-teal-200",
]

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { data: projects } = useProjects()

  const sidebarProjects = (projects ?? []).map((p, i) => ({
    id: p.id,
    name: p.name,
    color: SIDEBAR_COLORS[i % SIDEBAR_COLORS.length],
  }))

  return <DashboardLayout projects={sidebarProjects}>{children}</DashboardLayout>
}
