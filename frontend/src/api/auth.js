import { apiFetch } from './client'

export function loginApi({ email, password }) {
  return apiFetch('/auth/login', { method: 'POST', body: { email, password }, auth: false })
}

export function registerApi({ name, email, password }) {
  return apiFetch('/auth/register', { method: 'POST', body: { name, email, password }, auth: false })
}

export function changePasswordApi({ oldPassword, newPassword }) {
  return apiFetch('/auth/change-password', { method: 'POST', body: { oldPassword, newPassword } })
}