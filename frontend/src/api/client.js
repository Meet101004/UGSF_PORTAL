import { getToken } from '../store/authStore'

export async function apiFetch(path, { method='GET', headers={}, body } = {}) {
  const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/,'')
  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`

  const opts = {
    method,
    headers: { 'Content-Type':'application/json', ...(getToken()?{Authorization:`Bearer ${getToken()}`}:{}) , ...headers },
    credentials: 'include'
  }
  if (body !== undefined && method !== 'GET') opts.body = typeof body === 'string' ? body : JSON.stringify(body)

  let res
  try { res = await fetch(url, opts) }
  catch (e) {
    console.error('apiFetch network error:', url, e)
    throw new Error(`Network error. Cannot reach ${url}. Check VITE_API_URL, server, and CORS.`)
  }

  // Success with no body (e.g., 204) -> return {}
  if (res.ok && (res.status === 204 || res.headers.get('content-length') === '0')) {
    return {}
  }

  let data = null
  const text = await res.text().catch(() => '')
  if (text) {
    try { data = JSON.parse(text) } catch { /* ignore parse errors */ }
  }
  if (!res.ok) throw new Error(data?.error || `${res.status} ${res.statusText}`)
  return data ?? {}
}