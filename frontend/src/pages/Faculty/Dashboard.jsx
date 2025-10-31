import React, { useEffect, useState } from 'react'
import { getToken, clearAuth, getUser } from '../../store/authStore'
import { useNavigate, useParams } from 'react-router-dom'

export default function FacultyDashboard() {
  const navigate = useNavigate()
  const user = getUser()

  function logout() {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-white">
      {/* Header to match Student theme */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Faculty Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm/6 opacity-90 hidden sm:block">{user?.name} ({user?.email})</span>
            <button onClick={logout} className="bg-white text-emerald-700 hover:bg-white/90 px-3 py-1.5 rounded-md font-medium">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Welcome card */}
          <section className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Welcome{user?.name ? `, ${user.name}` : ''}!
            </h2>
            <p className="text-slate-600 mt-1">Review your assigned projects and manage weekly tasks.</p>
          </section>

          {/* Quick actions */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Assignments</h3>
                <span className="text-xs text-slate-500">Projects assigned to you</span>
              </div>
              <p className="text-sm text-slate-600 mt-2">Open your active project assignments and add weekly tasks.</p>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/faculty/assignments')}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg shadow"
                >
                  View Assigned Projects
                </button>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Tips</h3>
                <span className="text-xs text-slate-500">Quick help</span>
              </div>
              <ul className="mt-2 text-sm text-slate-600 list-disc pl-5 space-y-1">
                <li>Create weekly tasks with clear due dates.</li>
                <li>Mark tasks done to track student progress.</li>
                <li>Share resource links in task details.</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

// NEW PAGE in same file
export function FacultyAssignments() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const API = import.meta.env.VITE_API_URL || ''
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }
    async function load() {
      setError(''); setLoading(true)
      try {
        const r = await fetch(`${API}/applications/faculty/assignments?status=active`, { headers })
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.error || 'Failed to load')
        if (mounted) setRows(Array.isArray(d) ? d : [])
      } catch (e) { if (mounted) setError(e.message || 'Failed to load') }
      finally { if (mounted) setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-white">
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Assigned Projects</h1>
          <button onClick={() => navigate('/faculty')} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">
            Back
          </button>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {error && <div className="mb-3 text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded">{error}</div>}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow overflow-x-auto">
            <div className="px-4 py-3 border-b text-slate-800 font-semibold">Active Assignments</div>
            {loading ? (
              <div className="p-4">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="p-4">No active assignments</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-2">Student</th>
                    <th className="text-left px-4 py-2">Project</th>
                    <th className="text-left px-4 py-2">Description</th>
                    <th className="text-left px-4 py-2">Period</th>
                    <th className="text-left px-4 py-2">Link</th>
                    <th className="text-left px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(a => (
                    <tr key={a._id} className="border-t align-top">
                      <td className="px-4 py-2">{a.student ? `${a.student.name} (${a.student.email})` : '—'}</td>
                      <td className="px-4 py-2">{a.projectTitle}</td>
                      <td className="px-4 py-2 max-w-xs">
                        <div className="text-slate-700 line-clamp-3">{a.projectDesc || '—'}</div>
                      </td>
                      <td className="px-4 py-2">
                        {a.startDate ? new Date(a.startDate).toLocaleDateString() : '—'} - {a.endDate ? new Date(a.endDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-2">
                        {a.projectLink ? (
                          <a href={a.projectLink} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">Open</a>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => navigate(`/faculty/assignments/${a._id}`)}
                          className="text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-3 py-1.5 rounded"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// NEW: details page in same file
export function FacultyAssignmentDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const API = import.meta.env.VITE_API_URL || ''
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }

  const [tasks, setTasks] = useState([])
  const [tLoading, setTLoading] = useState(true)
  const [tError, setTError] = useState('')

  const [newTask, setNewTask] = useState({ title: '', details: '', dueDate: '' })

  async function loadTasks() {
    setTError(''); setTLoading(true)
    try {
      const r = await fetch(`${API}/applications/faculty/assignments/${id}/tasks`, { headers })
      const d = await r.json().catch(() => [])
      if (!r.ok) throw new Error(d.error || 'Failed to load tasks')
      setTasks(Array.isArray(d) ? d : [])
    } catch (e) { setTError(e.message || 'Failed to load tasks') }
    finally { setTLoading(false) }
  }

  useEffect(() => {
    let mounted = true
    async function load() {
      setError(''); setLoading(true)
      try {
        const r = await fetch(`${API}/applications/faculty/assignments/${id}`, { headers })
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.error || 'Failed to load')
        if (mounted) setData(d)
      } catch (e) { if (mounted) setError(e.message || 'Failed to load') }
      finally { if (mounted) setLoading(false) }
    }
    load()
    loadTasks()
    return () => { mounted = false }
  }, [id])

  async function addTask(e) {
    e.preventDefault()
    setTError('')
    const title = (newTask.title || '').trim()
    if (!title) return setTError('Title is required')

    const body = {
      title,
      details: (newTask.details || '').trim(),
      dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null
    }

    try {
      const r = await fetch(`${API}/applications/faculty/assignments/${id}/tasks`, {
        method: 'POST', headers, body: JSON.stringify(body)
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || `Failed (${r.status})`)
      setNewTask(s => ({ ...s, title: '', details: '' })) // keep due date default
      await loadTasks()
    } catch (err) {
      setTError(err.message || 'Failed to add task')
    }
  }

  async function markDone(taskId, status) {
    setTError('')
    const r = await fetch(`${API}/applications/faculty/assignments/${id}/tasks/${taskId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ status })
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) return setTError(d.error || 'Failed to update task')
    await loadTasks()
  }

  // Inline icons
  const Check = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5"/></svg>)
  const Clock = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>)
  const Calendar = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>)
  const Paperclip = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21.44 11.05 12 20.5a6 6 0 1 1-8.49-8.48l9.43-9.45a4 4 0 0 1 5.66 5.66L9.17 18.66a2 2 0 1 1-2.83-2.83l8.49-8.49"/></svg>)
  const Eye = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>)

  // Progress (UI only)
  const total = tasks.length
  const done = tasks.filter(t => t.status === 'completed').length
  const percent = total ? Math.round((done / total) * 100) : 0

  // Tasks pagination (frontend-only)
  const [tPage, setTPage] = useState(1)
  const [tPageSize, setTPageSize] = useState(5)
  const tPages = Math.max(1, Math.ceil(tasks.length / tPageSize))
  const tStart = (Math.min(Math.max(1, tPage), tPages) - 1) * tPageSize
  const tasksPage = tasks.slice(tStart, tStart + tPageSize)
  
  // "View task" toggle per card (UI only)
  const [openTasks, setOpenTasks] = useState({})
  const isOpen = (id) => (openTasks[id] ?? true) // default open
  const toggleTask = (id) => setOpenTasks(s => ({ ...s, [id]: !(s && s[id]) }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-white">
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Assignment Details</h1>
          <button onClick={() => navigate('/faculty/assignments')} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">
            Back
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        {loading ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow p-6">Loading…</div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4">{error}</div>
        ) : !data ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow p-6">Not found</div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow p-6 space-y-3">
            <div className="text-lg font-semibold text-slate-900">{data.projectTitle}</div>
            {data.student && (
              <div className="text-sm text-slate-600">Student: {data.student.name} ({data.student.email})</div>
            )}
            <div className="text-xs text-slate-500">
              {data.startDate ? `Start: ${new Date(data.startDate).toLocaleString()}` : 'Start: —'} • {data.endDate ? `End: ${new Date(data.endDate).toLocaleString()}` : 'End: —'}
            </div>
            <div className="text-slate-700 whitespace-pre-wrap">{data.projectDesc || 'No description provided.'}</div>
            {data.projectLink && (
              <a href={data.projectLink} target="_blank" rel="noopener noreferrer" className="inline-flex text-emerald-700 underline">
                Open project document
              </a>
            )}
          </div>
        )}

        {/* 1) Add Task (first) */}
        <section className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow p-6 mt-6">
          <h3 className="text-base font-semibold text-slate-900">Add Task</h3>
          <p className="text-xs text-slate-500">Create a weekly milestone for the student.</p>
          <form onSubmit={addTask} className="mt-3 grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm mb-1">Title</label>
              <input
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={newTask.title}
                onChange={(e) => setNewTask((s) => ({ ...s, title: e.target.value }))}
                placeholder="e.g., Week 2: Build UI components"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Details</label>
              <textarea
                rows={3}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={newTask.details}
                onChange={(e) => setNewTask((s) => ({ ...s, details: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Due Date</label>
              <input
                type="datetime-local"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={newTask.dueDate}
                onChange={(e) => setNewTask((s) => ({ ...s, dueDate: e.target.value }))}
              />
            </div>
            {tError && <div className="text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded text-sm">{tError}</div>}
            <button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg">
              Add Task
            </button>
          </form>
        </section>

        {/* 2) All Tasks (detailed with submissions) */}
        <section className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow p-6 mt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">All Tasks</h2>
              <span className="text-xs text-slate-500">{tLoading ? '—' : `${tasks.length} task${tasks.length === 1 ? '' : 's'} • ${done} done`}</span>
            </div>
            <Pagination
              page={tPage}
              pageSize={tPageSize}
              total={tasks.length}
              onPage={(p) => setTPage(Math.min(Math.max(1, p), tPages))}
              onPageSize={(s) => { setTPageSize(s); setTPage(1) }}
              sizes={[3,5,10]}
            />
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-[width] duration-500" style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-1 text-xs text-slate-500">{percent}% complete</div>
          </div>

          <div className="mt-5">
            {tError && <div className="mb-3 text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded">{tError}</div>}

            {tLoading ? (
              <div className="space-y-3">
                <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
                <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="mt-2 font-medium text-slate-900">No tasks yet</div>
                <div className="text-sm text-slate-600">Use the Add Task form above.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {tasksPage.map((t) => {
                  const completed = t.status === 'completed'
                  return (
                    <div key={t._id} className={`rounded-2xl border bg-white/70 transition-all hover:shadow-md ${completed ? 'border-emerald-200' : 'border-amber-200'}`}>
                      {/* Card header with "View task" toggle */}
                      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
                        <div className="min-w-0 flex items-center gap-2 flex-wrap">
                          <div className="font-medium text-slate-900 truncate">{t.title}</div>
                          <span className={`px-2 py-0.5 rounded text-xs ${completed ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                            {t.status}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleTask(t._id)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 text-sm"
                        >
                          <Eye className="h-4 w-4" /> {isOpen(t._id) ? 'Hide task' : 'View task'}
                        </button>
                      </div>

                      {isOpen(t._id) && (
                        <div className="p-4 flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            {t.details && <div className="text-sm text-slate-700 whitespace-pre-wrap">{t.details}</div>}
                            <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Due: {t.dueDate ? new Date(t.dueDate).toLocaleString() : '—'}</span>
                              {(t.submissions?.length || 0) > 0 && (
                                <span className="inline-flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" /> {t.submissions.length} submission{t.submissions.length === 1 ? '' : 's'}</span>
                              )}
                            </div>

                            {/* Submissions (detailed) */}
                            <div className="mt-3">
                              <div className="text-sm font-medium text-slate-800">Submissions</div>
                              {(t.submissions?.length || 0) === 0 ? (
                                <div className="text-sm text-slate-500 mt-1">No submissions yet.</div>
                              ) : (
                                <ul className="mt-2 space-y-1">
                                  {t.submissions.map((s) => (
                                    <li key={s._id} className="text-sm text-slate-700">
                                      <span className="text-xs text-slate-500 mr-2">{new Date(s.submittedAt).toLocaleString()}:</span>
                                      {s.link && (
                                        <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline mr-2">
                                          Link
                                        </a>
                                      )}
                                      {s.fileUrl && (
                                        <a href={s.fileUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline mr-2">
                                          {s.filename || 'File'}
                                        </a>
                                      )}
                                      {s.note && <span className="ml-1">{s.note}</span>}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            {completed ? (
                              <button onClick={() => markDone(t._id, 'pending')} className="inline-flex items-center gap-1.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5">↺ Reopen</button>
                            ) : (
                              <button onClick={() => markDone(t._id, 'completed')} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5"><Check className="h-4 w-4" /> Done</button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

// Local Pagination (frontend-only)
function Pagination({ page, pageSize, total, onPage, onPageSize, sizes = [5, 10, 20], className = '' }) {
  const pages = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)))
  const safe = Math.min(Math.max(1, page || 1), pages)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">Per page</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize?.(Number(e.target.value))}
          className="px-2 py-1 border rounded-md bg-white"
        >
          {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <button
        className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        onClick={() => onPage?.(safe - 1)}
        disabled={safe <= 1}
      >
        Prev
      </button>
      <span className="text-sm text-slate-500">Page {safe} of {pages}</span>
      <button
        className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        onClick={() => onPage?.(safe + 1)}
        disabled={safe >= pages}
      >
        Next
      </button>
    </div>
  )
}