import { apiFetch } from './client'
import { getToken, clearAuth } from '../store/authStore'
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
// Compat alias + auth header helper
const API = BASE
const auth = () => ({ Authorization: `Bearer ${getToken?.() || localStorage.getItem('token') || ''}` })

async function authFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = (typeof getToken === 'function' ? getToken() : localStorage.getItem('token')) || ''
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`${BASE}${path}`, { credentials: 'include', ...options, headers })
  if (res.status === 401) {
    try { typeof clearAuth === 'function' && clearAuth() } catch {}
    throw new Error('Unauthorized. Sign in as admin.')
  }
  return res
}

export function adminCreateUser({ name, email, role, password, department }) {
  return apiFetch('/admin/users', { method: 'POST', body: { name, email, role, password, department } })
}

// Stats endpoint (will fallback to dummy if backend not ready)
export function getApplicationStats() {
  return apiFetch('/admin/applications/stats', { method: 'GET' })
}

export async function getAdminStats() {
  const res = await authFetch('/admin/stats')
  return res.json()
}

export async function listAdminHods() {
  const r = await fetch(`${BASE}/admin/hods`, { headers: auth(), credentials: 'include' })
  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed'); return d
}

export async function listAdminProjects(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const r = await fetch(`${BASE}/admin/projects${qs ? `?${qs}` : ''}`, { headers: auth(), credentials: 'include' })
  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed'); return d
}

export async function createAdminProject(formData) {
  const r = await fetch(`${BASE}/admin/projects`, { method: 'POST', headers: auth(), body: formData, credentials: 'include' })
  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed'); return d
}

export async function assignAdminProject(projectId, hodId) {
  const r = await fetch(`${BASE}/admin/projects/${projectId}/assign-hod`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...auth() },
    body: JSON.stringify({ hodId }),
    credentials: 'include'
  })
  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed'); return d
}

export async function bulkProjectsExcel(file, hodId) {
  const fd = new FormData()
  fd.append('excel', file)
  if (hodId) fd.append('hodId', hodId)
  const r = await fetch(`${BASE}/admin/projects/bulk-excel`, {
    method: 'POST',
    headers: auth(), // no Content-Type for FormData
    body: fd,
    credentials: 'include'
  })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) {
    if (d?.errors?.length) {
      const first = d.errors.slice(0, 5).map(e => `Row ${e.row}: ${e.issues.join('; ')}`).join('\n')
      throw new Error(`${d.error}\n${first}${d.errors.length > 5 ? `\n...and ${d.errors.length - 5} more` : ''}`)
    }
    throw new Error(d.error || 'Bulk import failed')
  }
  return d
}