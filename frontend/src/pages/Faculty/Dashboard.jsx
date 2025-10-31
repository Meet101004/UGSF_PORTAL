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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-cyan-600 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Faculty Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-90">{user?.name} ({user?.email})</span>
          <button onClick={logout} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">Logout</button>
        </div>
      </header>
      <main className="p-6 space-y-4">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-medium mb-2">Welcome Faculty{user?.name ? `, ${user.name}` : ''}!</h2>
          <p className="text-slate-600">This is your faculty dashboard.</p>
        </div>

        {/* NEW: quick action */}
        <div className="bg-white rounded-xl shadow p-6">
          <button
            onClick={() => navigate('/faculty/assignments')}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded"
          >
            View Assigned Projects
          </button>
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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-cyan-600 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Assigned Projects</h1>
        <button onClick={() => navigate('/faculty')} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">Back</button>
      </header>
      <main className="p-6">
        {error && <div className="mb-3 text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded">{error}</div>}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
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
                        <a href={a.projectLink} target="_blank" rel="noopener noreferrer" className="text-cyan-700 underline">Open</a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => navigate(`/faculty/assignments/${a._id}`)}
                        className="text-white bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 rounded"
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-cyan-600 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Assignment Details</h1>
        <button onClick={() => navigate('/faculty/assignments')} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">Back</button>
      </header>
      <main className="max-w-3xl mx-auto p-6">
        {loading ? (
          <div className="bg-white rounded-xl shadow p-6">Loading…</div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4">{error}</div>
        ) : !data ? (
          <div className="bg-white rounded-xl shadow p-6">Not found</div>
        ) : (
          <div className="bg-white rounded-xl shadow p-6 space-y-3">
            <div className="text-lg font-semibold text-slate-900">{data.projectTitle}</div>
            {data.student && (
              <div className="text-sm text-slate-600">Student: {data.student.name} ({data.student.email})</div>
            )}
            <div className="text-xs text-slate-500">
              {data.startDate ? `Start: ${new Date(data.startDate).toLocaleString()}` : 'Start: —'} • {data.endDate ? `End: ${new Date(data.endDate).toLocaleString()}` : 'End: —'}
            </div>
            <div className="text-slate-700 whitespace-pre-wrap">{data.projectDesc || 'No description provided.'}</div>
            {data.projectLink && (
              <a href={data.projectLink} target="_blank" rel="noopener noreferrer" className="inline-flex text-cyan-700 underline">
                Open project document
              </a>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow p-6 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Weekly Tasks</h2>
          </div>

          {/* Add Task form is ALWAYS visible so you can add multiple */}
          <form onSubmit={addTask} className="mt-4 grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm mb-1">Title</label>
              <input
                className="w-full border rounded px-2 py-2"
                value={newTask.title}
                onChange={e => setNewTask(s => ({ ...s, title: e.target.value }))}
                placeholder="e.g., Week 2: Build UI components"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Details</label>
              <textarea
                rows={3}
                className="w-full border rounded px-2 py-2"
                value={newTask.details}
                onChange={e => setNewTask(s => ({ ...s, details: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded px-2 py-2"
                  value={newTask.dueDate}
                  onChange={e => setNewTask(s => ({ ...s, dueDate: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded">
                  Add Task
                </button>
              </div>
            </div>
          </form>

          {/* List tasks below; you can add more at any time */}
          <div className="mt-6">
            {tLoading ? (
              <div>Loading tasks…</div>
            ) : tasks.length === 0 ? (
              <div>No tasks yet.</div>
            ) : (
              tasks.map(t => (
                <div key={t._id} className="border rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{t.title}</div>
                    <span className={`px-2 py-1 rounded text-xs ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {t.status}
                    </span>
                  </div>
                  {t.details && <div className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{t.details}</div>}
                  <div className="text-xs text-slate-500 mt-1">Due: {t.dueDate ? new Date(t.dueDate).toLocaleString() : '—'}</div>

                  {(t.submissions?.length || 0) > 0 ? (
                    <div className="mt-2">
                      <div className="text-sm font-medium">Student submissions</div>
                      <ul className="mt-1 space-y-1">
                        {t.submissions.map(s => (
                          <li key={s._id} className="text-sm text-slate-700">
                            <span className="text-xs text-slate-500 mr-2">{new Date(s.submittedAt).toLocaleString()}:</span>
                            {s.link && <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-cyan-700 underline mr-2">Link</a>}
                            {s.fileUrl && <a href={s.fileUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-700 underline mr-2">{s.filename || 'File'}</a>}
                            {s.note && <span className="ml-1">{s.note}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-slate-500">No submissions yet.</div>
                  )}

                  <div className="mt-2">
                    {t.status === 'pending' ? (
                      <button onClick={() => markDone(t._id, 'completed')} className="text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded">Mark Done</button>
                    ) : (
                      <button onClick={() => markDone(t._id, 'pending')} className="text-slate-700 bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded">Reopen</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}