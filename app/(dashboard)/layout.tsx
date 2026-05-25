import ClientLayout from "@/app/client-layout"
import type React from "react"

export const dynamic = "force-dynamic"

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>
}
