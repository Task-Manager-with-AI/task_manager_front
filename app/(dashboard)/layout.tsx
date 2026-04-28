import ClientLayout from "@/app/client-layout"
import type React from "react"

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>
}
