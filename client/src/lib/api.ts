export const API_BASE = import.meta.env.DEV
  ? "/api/v1"
  : "http://localhost:8080/api/v1"

export const SOCKET_URL = import.meta.env.DEV
  ? `http://${window.location.hostname}:8080`
  : "http://localhost:8080"

export type Note = {
  id: string
  data: string
  title: string
  version: number
  creatorId: string
  createdAt: string
  updatedAt: string
}

export type NoteCollection = {
  createdNotes: Note[]
  grantedNotes: Note[]
}

export function getUserId(token: string) {
  try {
    const payload = token.split(".")[1]
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    return (JSON.parse(decoded) as { id?: string }).id ?? null
  } catch {
    return null
  }
}

export async function apiRequest<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const payload = await response.json() as { message?: string }
      if (payload.message) message = payload.message
    } catch {
      // Keep the status-based error when the server response is not JSON.
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}
