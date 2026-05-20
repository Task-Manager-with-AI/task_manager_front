import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LocaleProvider } from "@/components/locale-provider"
import { DocumentTitle } from "@/components/document-title"
import { QueryProvider } from "@/app/query-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Mondays",
  description: "Agile task manager with AI features",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <LocaleProvider>
            <DocumentTitle />
            <QueryProvider>{children}</QueryProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
