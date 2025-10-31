const KEY = 'auth' // one key for everything

let cache = null

export function setAuth({ token, role, user, mustChangePassword }) {
  cache = { token, role, user, mustChangePassword: !!mustChangePassword }
  localStorage.setItem(KEY, JSON.stringify(cache))
}

export function getAuth() {
  if (cache) return cache
  const raw = localStorage.getItem(KEY)
  cache = raw ? JSON.parse(raw) : null
  return cache
}

export function getToken() {
  return getAuth()?.token || null
}

export function getRole() {
  return getAuth()?.role || null
}

export function getUser() {
  return getAuth()?.user || null
}

export function getMustChangePassword() {
  return !!getAuth()?.mustChangePassword
}

export function clearAuth() {
  cache = null
  localStorage.removeItem(KEY)
}