import { apiFetch } from './client'
import { getToken } from '../store/authStore'
const API = import.meta.env.VITE_API_URL || ''

const auth = () => ({ Authorization: `Bearer ${getToken()}` })

export function adminCreateUser({ name, email, role, password, department }) {
  return apiFetch('/admin/users', { method: 'POST', body: { name, email, role, password, department } })
}

// Stats endpoint (will fallback to dummy if backend not ready)
export function getApplicationStats() {
  return apiFetch('/admin/applications/stats', { method: 'GET' })
}

export async function listAdminHods() {
  const r = await fetch(`${API}/admin/hods`, { headers: auth() })
  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed'); return d
}

export async function listAdminProjects(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const r = await fetch(`${API}/admin/projects${qs ? `?${qs}` : ''}`, { headers: auth() })
  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed'); return d
}

export async function createAdminProject(formData) {
  const r = await fetch(`${API}/admin/projects`, { method: 'POST', headers: auth(), body: formData })
  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed'); return d
}

export async function assignAdminProject(projectId, hodId) {
  const r = await fetch(`${API}/admin/projects/${projectId}/assign-hod`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...auth() },
    body: JSON.stringify({ hodId })
  })
  const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed'); return d
}

export async function bulkProjectsExcel(file, hodId) {
  const fd = new FormData()
  fd.append('excel', file) // must be 'excel' to match excelUpload.single('excel')
  if (hodId) fd.append('hodId', hodId)
  const r = await fetch(`${API}/admin/projects/bulk-excel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` }, // do not set Content-Type for FormData
    body: fd
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