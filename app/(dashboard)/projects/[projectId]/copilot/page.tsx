"use client"

import { useParams } from "next/navigation"
import { CopilotPanel } from "@/features/copilot/CopilotPanel"

export default function CopilotPage() {
  const { projectId } = useParams<{ projectId: string }>()
  return <CopilotPanel projectId={projectId} />
}
