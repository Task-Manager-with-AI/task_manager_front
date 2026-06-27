"use client"

import { useCurrentUser } from "@/features/auth/auth.hooks"
import { FeedbackWidget } from "./FeedbackWidget"

export function FeedbackWidgetWrapper() {
  const { data: user } = useCurrentUser()
  const isSuperAdmin = user?.role?.name === "SUPER_ADMIN"
  if (isSuperAdmin) return null
  return <FeedbackWidget />
}
