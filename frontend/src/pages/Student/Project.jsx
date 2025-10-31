import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyApplication } from '../../api/applications'
import { getToken } from '../../store/authStore'

export default function StudentProject() {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [tasks, setTasks] = useState([])
  const [tError, setTError] = useState('')
  const [formMap, setFormMap] = useState({}) // { [taskId]: { link, note, file } }

  const API = import.meta.env.VITE_API_URL || ''

  useEffect(() => {
    let mounted = true
    getMyApplication()
      .then(async d => {
        if (!mounted) return
        setState({ loading: false, data: d, error: '' })
        if (d?.assignedAssignmentId) {
          const r = await fetch(`${API}/applications/student/assignments/${d.assignedAssignmentId}/tasks`, {
            headers: { Authorization: `Bearer ${getToken()}` }
          })
          const t = await r.json().catch(() => [])
          if (!r.ok) throw new Error(t.error || 'Failed to load tasks')
          setTasks(Array.isArray(t) ? t : [])
        }
      })
      .catch(e => setState({ loading: false, data: null, error: e.message || 'Failed to load' }))
    return () => { mounted = false }
  }, [])

  async function submitWork(taskId) {
    try {
      setTError('')
      const f = formMap[taskId] || {}
      if (!f.link && !f.file && !f.note) return setTError('Provide a link, file, or note')
      const fd = new FormData()
      if (f.link) fd.append('link', f.link)
      if (f.note) fd.append('note', f.note)
      if (f.file) fd.append('file', f.file)
      const aid = state.data.assignedAssignmentId
      const r = await fetch(`${API}/applications/student/assignments/${aid}/tasks/${taskId}/submissions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Failed to submit')
      // reload tasks
      const r2 = await fetch(`${API}/applications/student/assignments/${aid}/tasks`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      const t = await r2.json().catch(() => [])
      if (!r2.ok) throw new Error(t.error || 'Failed to load tasks')
      setTasks(Array.isArray(t) ? t : [])
      setFormMap(m => ({ ...m, [taskId]: { link: '', note: '', file: null } }))
    } catch (e) {
      setTError(e.message || 'Failed to submit')
    }
  }

  const d = state.data
  const assigned = !!d?.assignedProjectTitle

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">Back</button>
          <h1 className="text-xl font-semibold">Project Description</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        {state.loading ? (
          <div className="bg-white rounded-xl shadow p-6">Loading…</div>
        ) : state.error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4">{state.error}</div>
        ) : !assigned ? (
          <div className="bg-white rounded-xl shadow p-6">No project assigned yet.</div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow p-6 space-y-3">
              <div className="text-lg font-semibold text-slate-900">{d.assignedProjectTitle}</div>
              {d.assignedFaculty && (
                <div className="text-sm text-slate-600">
                  Faculty: {d.assignedFaculty.name} ({d.assignedFaculty.email})
                </div>
              )}
              {d.assignedAt && (
                <div className="text-xs text-slate-400">Assigned on {new Date(d.assignedAt).toLocaleString()}</div>
              )}
              {d.assignedProjectDescription ? (
                <p className="text-slate-700 whitespace-pre-wrap">{d.assignedProjectDescription}</p>
              ) : (
                <p className="text-slate-500">No description provided.</p>
              )}
              {d.assignedProjectLink && (
                <a
                  href={d.assignedProjectLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-indigo-700 hover:text-indigo-900 underline"
                >
                  Open project document
                </a>
              )}
            </div>

            {/* Weekly Tasks + Submit */}
            <div className="bg-white rounded-xl shadow p-6 mt-6">
              <h2 className="text-base font-semibold text-slate-800">Weekly Tasks</h2>
              {tError && <div className="mt-2 text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded">{tError}</div>}

              {tasks.length === 0 ? (
                <div className="mt-2 text-slate-600">No tasks yet.</div>
              ) : (
                <div className="mt-3 space-y-4">
                  {tasks.map(t => {
                    const isCompleted = String(t.status).toLowerCase() === 'completed'
                    return (
                      <div key={t._id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{t.title}</div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>{t.status}</span>
                        </div>
                        {t.details && <div className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{t.details}</div>}
                        <div className="text-xs text-slate-500 mt-1">
                          Due: {t.dueDate ? new Date(t.dueDate).toLocaleString() : '—'}
                        </div>

                        {/* Previous submissions (always visible) */}
                        {(t.submissions?.length || 0) > 0 && (
                          <div className="mt-2">
                            <div className="text-sm font-medium">Your submissions</div>
                            <ul className="mt-1 space-y-1">
                              {t.submissions.map((s) => (
                                <li key={s._id} className="text-sm text-slate-700">
                                  <span className="text-xs text-slate-500 mr-2">{new Date(s.submittedAt).toLocaleString()}:</span>
                                  {s.link && <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-indigo-700 underline mr-2">Link</a>}
                                  {s.fileUrl && <a href={s.fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-700 underline mr-2">{s.filename || 'File'}</a>}
                                  {s.note && <span className="ml-1">{s.note}</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Submit work */}
                        {isCompleted ? (
                          <div className="mt-3 text-sm text-slate-500">
                            This task is completed. Contact your faculty if you need to submit more work.
                          </div>
                        ) : (
                          <>
                            <div className="mt-3 grid grid-cols-1 md-grid-cols-3 gap-2">
                              <input
                                className="border rounded px-2 py-2"
                                placeholder="Drive/Git/Doc link"
                                value={formMap[t._id]?.link || ''}
                                onChange={e => setFormMap(m => ({ ...m, [t._id]: { ...(m[t._id]||{}), link: e.target.value } }))}
                              />
                              <input
                                className="border rounded px-2 py-2"
                                placeholder="Note"
                                value={formMap[t._id]?.note || ''}
                                onChange={e => setFormMap(m => ({ ...m, [t._id]: { ...(m[t._id]||{}), note: e.target.value } }))}
                              />
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,image/*,text/plain"
                                className="border rounded px-2 py-2"
                                onChange={e => setFormMap(m => ({ ...m, [t._id]: { ...(m[t._id]||{}), file: e.target.files?.[0] || null } }))}
                              />
                            </div>
                            <div className="mt-2">
                              <button
                                onClick={() => submitWork(t._id)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded"
                              >
                                Submit Work
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}