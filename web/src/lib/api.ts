const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

function getToken() {
  if (typeof document === 'undefined') return ''
  return document.cookie.match(/juno_session=([^;]+)/)?.[1] ?? ''
}

export async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API}/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}
