import { apiFetch } from './client'

export function createMyApplication(payload) {
  return apiFetch('/applications', { method: 'POST', body: payload })
}

export function getMyApplication() {
  return apiFetch('/applications/me', { method: 'GET' })
}

export function updateMyApplication(payload) {
  return apiFetch('/applications/me', { method: 'PATCH', body: payload })
}

export function uploadApplicationDocument(appId, type, file) {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const token = JSON.parse(localStorage.getItem('auth') || '{}')?.token || ''
  const form = new FormData()
  form.append('file', file)
  return fetch(`${API_BASE}/applications/${appId}/documents/${type}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Upload failed')
    return data
  })
}