import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAssignmentOptions, createAssignment, listAssignments } from '../../api/hod'

// Inline icons (no deps)
const InboxIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>)
const ClipboardIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4"/><path d="M9 12h6M9 16h6M9 8h6"/></svg>)
const UsersIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>)
const CalendarIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>)

export default function HODAssignments() {
  const navigate = useNavigate()
  const [opts, setOpts] = useState({ students: [], faculties: [], projects: [] })
  const [form, setForm] = useState({ studentId: '', facultyId: '', projectId: '', projectTitle: '', projectDesc: '', startDate: '', endDate: '' })
  const [projMode, setProjMode] = useState('existing') // 'existing' | 'custom'
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [assignments, setAssignments] = useState([])

  // pagination (client-only) for Active Assignments
  const [aPage, setAPage] = useState(1)
  const [aSize, setASize] = useState(10)

  async function load() {
    setError('')
    try {
      const [o, a] = await Promise.all([getAssignmentOptions(), listAssignments({ status: 'active' })])
      setOpts(o); setAssignments(a)
      if (!o.projects?.length) setProjMode('custom')
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => { load() }, [])

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.studentId || !form.facultyId || (projMode === 'existing' && !form.projectId && !form.projectTitle.trim()) || (projMode === 'custom' && !form.projectTitle.trim())) {
      return setError('Select student, faculty and project')
    }
    try {
      setSaving(true)
      await createAssignment({
        studentId: form.studentId,
        facultyId: form.facultyId,
        projectId: projMode === 'existing' ? (form.projectId || undefined) : undefined,
        projectTitle: projMode === 'custom' ? form.projectTitle.trim() : (form.projectId ? undefined : form.projectTitle.trim()),
        projectDesc: projMode === 'custom' ? (form.projectDesc || '').trim() : (form.projectId ? undefined : (form.projectDesc || '').trim()),
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined
      })
      setForm({ studentId: '', facultyId: '', projectId: '', projectTitle: '', projectDesc: '', startDate: '', endDate: '' })
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // derive page slice
  const total = assignments.length
  const pages = Math.max(1, Math.ceil(total / aSize))
  const page = Math.min(Math.max(1, aPage), pages)
  const start = (page - 1) * aSize
  const slice = assignments.slice(start, start + aSize)

  // preview helpers
  const student = opts.students.find(s => s._id === form.studentId)
  const faculty = opts.faculties.find(f => f._id === form.facultyId)
  const proj = projMode === 'existing' ? opts.projects.find(p => p._id === form.projectId) : null
  const previewTitle = proj ? proj.title : (form.projectTitle || '—')
  const periodText = `${form.startDate ? new Date(form.startDate).toLocaleDateString() : '—'} — ${form.endDate ? new Date(form.endDate).toLocaleDateString() : '—'}`

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-emerald-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold inline-flex items-center gap-2">
            <ClipboardIcon className="h-5 w-5" /> Assignments
          </h1>
          <button
            className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md"
            onClick={() => navigate(-1)}
          >
            Back to Dashboard
          </button>
        </div>
      </header>
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Stats summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center">
                <UsersIcon className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Students</div>
                <div className="font-semibold text-slate-800">{opts.students.length}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center">
                <UsersIcon className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Faculties</div>
                <div className="font-semibold text-slate-800">{opts.faculties.length}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center">
                <ClipboardIcon className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Projects</div>
                <div className="font-semibold text-slate-800">{opts.projects.length}</div>
              </div>
            </div>
          </div>

          {error && <div className="mb-3 text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded">{error}</div>}

          {/* Form + Preview */}
          <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Form card */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
              <div className="text-slate-800 font-semibold inline-flex items-center gap-2">
                <ClipboardIcon className="h-4 w-4" /> Create Assignment
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Student</label>
                  <select className="w-full border rounded px-2 py-2" value={form.studentId}
                    onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}>
                    <option value="">Select student</option>
                    {opts.students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Faculty</label>
                  <select className="w-full border rounded px-2 py-2" value={form.facultyId}
                    onChange={e => setForm(f => ({ ...f, facultyId: e.target.value }))}>
                    <option value="">Select faculty</option>
                    {opts.faculties.map(f => <option key={f._id} value={f._id}>{f.name} ({f.email})</option>)}
                  </select>
                </div>
              </div>

              {/* Project mode toggle */}
              <div>
                <label className="block text-sm mb-1">Project</label>
                <div className="inline-flex rounded-md border border-slate-200 overflow-hidden mb-2">
                  <button
                    type="button"
                    onClick={() => { setProjMode('existing'); setForm(f => ({ ...f, projectTitle: '', projectDesc: '' })) }}
                    className={`px-3 py-1.5 text-sm ${projMode === 'existing' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => { setProjMode('custom'); setForm(f => ({ ...f, projectId: '' })) }}
                    className={`px-3 py-1.5 text-sm border-l border-slate-200 ${projMode === 'custom' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    Custom
                  </button>
                </div>

                {projMode === 'existing' ? (
                  <div>
                    <select className="w-full border rounded px-2 py-2" value={form.projectId}
                      onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}>
                      <option value="">Select existing project</option>
                      {opts.projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                    </select>
                    <div className="text-xs text-slate-500 mt-1">Pick from existing projects or switch to custom.</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <input className="w-full border rounded px-2 py-2" value={form.projectTitle}
                        onChange={e => setForm(f => ({ ...f, projectTitle: e.target.value }))} placeholder="Custom project title" />
                    </div>
                    <div>
                      <textarea rows={2} className="w-full border rounded px-2 py-2" value={form.projectDesc}
                        onChange={e => setForm(f => ({ ...f, projectDesc: e.target.value }))} placeholder="Description (optional)" />
                    </div>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Start Date</label>
                  <input type="datetime-local" className="w-full border rounded px-2 py-2" value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">End Date</label>
                  <input type="datetime-local" className="w-full border rounded px-2 py-2" value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white px-4 py-2 rounded">
                  {saving ? 'Assigning...' : 'Create Assignment'}
                </button>
              </div>
            </div>

            {/* Live Preview */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="text-slate-800 font-semibold inline-flex items-center gap-2 mb-2">
                <InboxIcon className="h-4 w-4" /> Preview
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold">
                    {(student?.name || '—').toString().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-slate-800 truncate">{student ? student.name : 'Select student'}</div>
                    <div className="text-slate-500 truncate">{student?.email || '—'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center">
                    <UsersIcon className="h-4 w-4 text-slate-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-slate-800 truncate">{faculty ? faculty.name : 'Select faculty'}</div>
                    <div className="text-slate-500 truncate">{faculty?.email || '—'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center">
                    <ClipboardIcon className="h-4 w-4 text-slate-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-slate-800 truncate">{previewTitle}</div>
                    <div className="text-slate-500 truncate">{projMode === 'custom' ? (form.projectDesc || '—') : (proj?.summary || '—')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center">
                    <CalendarIcon className="h-4 w-4 text-slate-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-slate-800">{periodText}</div>
                    <div className="text-slate-500">Assignment period</div>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Active Assignments */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mt-6 overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="text-slate-800 font-semibold inline-flex items-center gap-2">
                <InboxIcon className="h-4 w-4" /> Active Assignments
              </div>
              <Pagination
                page={aPage}
                pageSize={aSize}
                total={assignments.length}
                onPage={(p) => setAPage(p)}
                onPageSize={(s) => { setASize(s); setAPage(1) }}
                sizes={[5,10,20]}
              />
            </div>
            <div className="overflow-x-auto">
              {slice.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <InboxIcon className="h-5 w-5" />
                  </div>
                  <div className="mt-2 font-medium text-slate-900">No active assignments</div>
                  <div className="text-sm text-slate-600">Create a new assignment using the form above.</div>
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-2">Student</th>
                      <th className="text-left px-4 py-2">Faculty</th>
                      <th className="text-left px-4 py-2">Project</th>
                      <th className="text-left px-4 py-2">Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slice.map(a => (
                      <tr key={a._id} className="border-t">
                        <td className="px-4 py-2">{a.student?.name} <span className="text-slate-500">({a.student?.email})</span></td>
                        <td className="px-4 py-2">{a.faculty?.name} <span className="text-slate-500">({a.faculty?.email})</span></td>
                        <td className="px-4 py-2">{a.projectTitle}</td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                            <CalendarIcon className="h-4 w-4" />
                            {a.startDate ? new Date(a.startDate).toLocaleDateString() : '—'} — {a.endDate ? new Date(a.endDate).toLocaleDateString() : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Local Pagination (First | Prev | Next | Last)
function Pagination({ page = 1, pageSize = 10, total = 0, onPage, onPageSize, sizes = [5, 10, 20], className = '' }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const p = Math.min(Math.max(1, page), pages)
  const canPrev = p > 1
  const canNext = p < pages
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="hidden sm:flex items-center gap-2 text-sm">
        <span className="text-slate-500">Per page</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize?.(Number(e.target.value))}
          className="px-2 py-1 border rounded-md bg-white"
        >
          {sizes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <button className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50" onClick={() => onPage?.(1)} disabled={!canPrev}>« First</button>
      <button className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50" onClick={() => onPage?.(p - 1)} disabled={!canPrev}>‹ Prev</button>
      <span className="text-sm text-slate-500 px-1">Page {p} of {pages}</span>
      <button className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50" onClick={() => onPage?.(p + 1)} disabled={!canNext}>Next ›</button>
      <button className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50" onClick={() => onPage?.(pages)} disabled={!canNext}>Last »</button>
    </div>
  )
}