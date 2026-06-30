"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, MessageCircle, Search, Users } from "lucide-react"
import { useTranslation } from "@/components/locale-provider"
import { useUsers } from "@/features/users/users.hooks"
import { useCurrentUser } from "@/features/auth/auth.hooks"
import { useGetOrCreateDirectChat } from "@/features/chats/chats.hooks"
import { getMockPersonForUser, getTeamById, isPersonWorking } from "@/lib/people"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function PeoplePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: users, isLoading } = useUsers()
  const { data: currentUser } = useCurrentUser()
  const directChat = useGetOrCreateDirectChat()
  const [searchQuery, setSearchQuery] = useState("")

  const handleMessage = (userId: string) => {
    directChat.mutate(userId, {
      onSuccess: (chat) => router.push(`/chats?chatId=${chat.id}`),
    })
  }

  const filteredUsers = useMemo(() => {
    const list = users ?? []
    const query = searchQuery.trim().toLowerCase()
    if (!query) return list
    return list.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    )
  }, [users, searchQuery])

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">{t("people.title")}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("people.subtitle")}</p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("people.searchPlaceholder")}
            className="pl-10"
            aria-label={t("common.search")}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-28 w-full" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800 sm:p-10">
          <p className="font-medium text-gray-900 dark:text-white">{t("people.noMembers")}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("people.noMembersHint")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => {
            const mock = getMockPersonForUser(user.id)
            const team = getTeamById(mock.team)
            const working = isPersonWorking(mock)
            return (
              <Card key={user.id} className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <CardContent className="flex items-start gap-4 p-5">
                  <Avatar className="h-14 w-14 shrink-0">
                    <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {user.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900 dark:text-white">{user.name}</p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={user.isActive ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}
                      >
                        {user.isActive ? t("people.active") : t("people.inactive")}
                      </Badge>
                      {team && (
                        <Badge variant="secondary" className={team.color}>
                          <Users className="mr-1 h-3 w-3" />
                          {team.name}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Clock className="h-3 w-3 shrink-0" />
                      {mock.workingHours.start} – {mock.workingHours.end}
                      <span className={working ? "ml-1 inline-block h-2 w-2 rounded-full bg-green-400" : "ml-1 inline-block h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600"} />
                    </p>
                    {currentUser?.id !== user.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        disabled={directChat.isPending}
                        onClick={() => handleMessage(user.id)}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        {t("chat.message")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
