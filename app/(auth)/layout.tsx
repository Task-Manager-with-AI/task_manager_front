"use client"

import type React from "react"
import { GoogleOAuthProvider } from "@react-oauth/google"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        {children}
      </div>
    </GoogleOAuthProvider>
  )
}
