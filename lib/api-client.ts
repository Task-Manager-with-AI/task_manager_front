const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.errors = errors
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  })

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new ApiError(res.status, body.message ?? "Request failed", body.errors)
  }

  return body.data as T
}

export const apiClient = {
  get<T>(path: string) {
    return request<T>(path)
  },
  post<T>(path: string, data?: unknown) {
    return request<T>(path, { method: "POST", body: JSON.stringify(data) })
  },
  patch<T>(path: string, data?: unknown) {
    return request<T>(path, { method: "PATCH", body: JSON.stringify(data) })
  },
  delete<T>(path: string) {
    return request<T>(path, { method: "DELETE" })
  },
}
