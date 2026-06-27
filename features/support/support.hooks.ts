"use client"

import { useMutation } from "@tanstack/react-query"
import { supportApi } from "./support.api"
import type { ContactPayload } from "./support.types"

export function useSendSupportContact() {
  return useMutation({
    mutationFn: (payload: ContactPayload) => supportApi.contact(payload),
  })
}
