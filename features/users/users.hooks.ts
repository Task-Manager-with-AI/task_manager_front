"use client"

import { useQuery } from "@tanstack/react-query"
import { usersApi } from "./users.api"

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: usersApi.list,
  })
}
