import { getToken } from '../store/authStore'
import { apiFetch } from './client'

const API = import.meta.env.VITE_API_URL || ''

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`
})

// List applications (filter: pending|accepted|rejected|all)
export function getHodApplications(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return apiFetch(`/hod/applications${qs ? `?${qs}` : ''}`)
}
export function getHodApplication(id) {
  return apiFetch(`/hod/applications/${id}`)
}
export function setHodApplicationStatus(id, status, note) {
  return apiFetch(`/hod/applications/${id}/status`, { method: 'PATCH', body: { status, note } })
}

// Interviews
export function scheduleInterview(payload) {
  return apiFetch(`/hod/interviews`, { method: 'POST', body: payload })
}
export function listHodInterviews(params = {}) {
  const q = new URLSearchParams(params).toString()
  return apiFetch(`/hod/interviews${q ? `?${q}` : ''}`, { method: 'GET' })
}
export function setInterviewResult(interviewId, result, note) {
  return apiFetch(`/hod/interviews/${interviewId}/result`, {
    method: 'PATCH',
    body: { result, note }
  })
}

// Faculties and assignment
export function listDepartmentFaculties() {
  return fetch(`${API}/hod/faculties`, { headers: headers() })
    .then(r => r.json().then(d => (r.ok ? d : Promise.reject(d?.error || 'Failed'))))
}

export function assignFacultyProject(appId, payload) {
  return fetch(`${API}/hod/applications/${appId}/assign`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(payload)
  }).then(r => r.json().then(d => (r.ok ? d : Promise.reject(d?.error || 'Failed'))))
}

// Projects and eligible students
export function listDepartmentProjects() {
  return fetch(`${API}/hod/projects`, { headers: headers() })
    .then(r => r.json().then(d => (r.ok ? d : Promise.reject(d?.error || 'Failed'))))
}

export function listEligibleStudents() {
  return fetch(`${API}/hod/eligible-students`, { headers: headers() })
    .then(r => r.json().then(d => (r.ok ? d : Promise.reject(d?.error || 'Failed'))))
}

export function getAssignmentOptions() {
  return apiFetch(`/hod/assignments/options`, { method: 'GET' })
}

export function createAssignment(payload) {
  return apiFetch(`/hod/assignments`, { method: 'POST', body: payload })
}

export function listAssignments(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return apiFetch(`/hod/assignments${qs ? `?${qs}` : ''}`, { method: 'GET' })
}