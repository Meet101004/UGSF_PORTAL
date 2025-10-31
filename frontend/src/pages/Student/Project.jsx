import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyApplication } from '../../api/applications'
import { getToken } from '../../store/authStore'

// Inline icons (UI only)
const Calendar = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)
const Clock = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
)
const CheckCircle = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="M22 4 12 14.01l-3-3" />
  </svg>
)
const AlertCircle = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
)
const Paperclip = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21.44 11.05 12 20.5a6 6 0 1 1-8.49-8.49l10-10a4 4 0 1 1 5.66 5.66l-10 10a2 2 0 1 1-2.83-2.83l9.19-9.2" />
  </svg>
)
const LinkIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10 13a5 5 0 0 0 7.07 0l1.17-1.17a5 5 0 1 0-7.07-7.07L10 5" />
    <path d="M14 11a5 5 0 0 0-7.07 0L5.76 12.17a5 5 0 0 0 7.07 7.07L14 19" />
  </svg>
)
const ChevronLeft = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m15 18-6-6 6-6" />
  </svg>
)
const ChevronRight = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m9 18 6-6-6-6" />
  </svg>
)
const SearchIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-3.5-3.5" />
  </svg>
)
const Eye = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const UploadCloud = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 3 15.25" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
)

export default function StudentProject() {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [tasks, setTasks] = useState([])
  const [tError, setTError] = useState('')
  const [formMap, setFormMap] = useState({}) // { [taskId]: { link, note, file } }

  // UI-only state
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all|pending|completed
  const [viewByWeek, setViewByWeek] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [weekIndex, setWeekIndex] = useState(0)
  const [expanded, setExpanded] = useState({}) // { [taskId]: true }

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

  // ----- UI helpers (frontend only) -----
  function getISOWeekInfo(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    // week range (Mon - Sun)
    const local = new Date(date)
    const localDay = local.getDay() || 7 // 1..7
    const monday = new Date(local)
    monday.setDate(local.getDate() - localDay + 1)
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    return { year: d.getUTCFullYear(), week, monday, sunday }
  }

  function groupTasksByWeek(rows) {
    const groups = {}
    for (const t of rows) {
      if (!t.dueDate) {
        groups['no-date'] = groups['no-date'] || { key: 'no-date', label: 'No due date', monday: null, tasks: [] }
        groups['no-date'].tasks.push(t)
        continue
      }
      const dt = new Date(t.dueDate)
      const { year, week, monday, sunday } = getISOWeekInfo(dt)
      const key = `${year}-W${String(week).padStart(2, '0')}`
      const label = `Week ${week}, ${year} • ${monday.toLocaleDateString()}–${sunday.toLocaleDateString()}`
      if (!groups[key]) groups[key] = { key, label, monday, tasks: [] }
      groups[key].tasks.push(t)
    }
    const arr = Object.values(groups)
      .sort((a, b) => {
        if (a.key === 'no-date') return 1
        if (b.key === 'no-date') return -1
        return (a.monday?.getTime() || 0) - (b.monday?.getTime() || 0)
      })
    return arr
  }

  function normalizeStatus(s) {
    const v = String(s || '').toLowerCase()
    if (v === 'completed' || v === 'complete' || v === 'done') return 'completed'
    return 'pending'
  }

  const d = state.data
  const assigned = !!d?.assignedProjectTitle

  // Filtering + sorting
  const filtered = (Array.isArray(tasks) ? tasks : [])
    .filter(t => {
      if (statusFilter !== 'all' && normalizeStatus(t.status) !== statusFilter) return false
      const q = query.trim().toLowerCase()
      if (!q) return true
      const hay = [
        t.title || '',
        t.details || '',
        (t.submissions || []).map(s => [s.note || '', s.filename || '', s.link || ''].join(' ')).join(' ')
      ].join(' ').toLowerCase()
      return hay.includes(q)
    })
    .sort((a, b) => {
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      return ad - bd
    })

  // Week groups or list pagination
  const weekGroups = viewByWeek ? groupTasksByWeek(filtered) : []
  const safeWeekIndex = Math.min(Math.max(0, weekIndex), Math.max(0, weekGroups.length - 1))
  const currentWeek = viewByWeek ? (weekGroups[safeWeekIndex] || null) : null
  const listTotalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const listPage = Math.min(Math.max(1, page), listTotalPages)
  const listSlice = filtered.slice((listPage - 1) * pageSize, (listPage - 1) * pageSize + pageSize)

  const shownTasks = viewByWeek ? (currentWeek?.tasks || []) : listSlice

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-white">
      {/* Themed header to match Dashboard */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">Back</button>
            <h1
              className="text-xl font-semibold tracking-tight truncate"
              title={state?.data?.assignedProjectTitle || 'Project'}
            >
              {state?.data?.assignedProjectTitle || 'Project'}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {state.loading ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow p-6">Loading…</div>
        ) : state.error ? (
          <div className="bg-rose-50/90 border border-rose-200 text-rose-700 rounded-2xl p-4">{state.error}</div>
        ) : !assigned ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow p-6">No project assigned yet.</div>
        ) : (
          <>
            {/* Project summary card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow p-6 space-y-3">
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
                  className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 underline"
                >
                  <Paperclip className="h-4 w-4" /> Open project document
                </a>
              )}
            </div>

            {/* Weekly Tasks */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-800">Tasks</h2>
                  <span className="text-xs text-slate-500">({filtered.length} result{filtered.length === 1 ? '' : 's'})</span>
                </div>

                {/* Controls: search, status filter, view toggle */}
                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  <div className="relative">
                    <SearchIcon className="h-4 w-4 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                    <input
                      value={query}
                      onChange={e => { setQuery(e.target.value); setPage(1); setWeekIndex(0) }}
                      placeholder="Search tasks…"
                      className="pl-8 pr-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(1); setWeekIndex(0) }}
                    className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Group:</span>
                    <button
                      onClick={() => setViewByWeek(true)}
                      className={`px-3 py-1.5 rounded-md text-sm border ${viewByWeek ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white'}`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setViewByWeek(false)}
                      className={`px-3 py-1.5 rounded-md text-sm border ${!viewByWeek ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white'}`}
                    >
                      List
                    </button>
                  </div>
                </div>
              </div>

              {/* Week pagination or list pagination */}
              {viewByWeek ? (
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-slate-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span>{currentWeek ? currentWeek.label : 'No weeks available'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      disabled={safeWeekIndex <= 0}
                      onClick={() => setWeekIndex(i => Math.max(0, i - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-slate-500">
                      {weekGroups.length ? safeWeekIndex + 1 : 0} / {weekGroups.length || 0}
                    </span>
                    <button
                      className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      disabled={safeWeekIndex >= weekGroups.length - 1}
                      onClick={() => setWeekIndex(i => Math.min(weekGroups.length - 1, i + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      disabled={listPage <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-slate-500">
                      Page {listPage} of {listTotalPages}
                    </span>
                    <button
                      className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      disabled={listPage >= listTotalPages}
                      onClick={() => setPage(p => Math.min(listTotalPages, p + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">Per page</span>
                    <select
                      value={pageSize}
                      onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                      className="px-2 py-1 border rounded-md bg-white"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                </div>
              )}

              {tError && <div className="mt-3 text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">{tError}</div>}

              {/* Task list */}
              {shownTasks.length === 0 ? (
                <div className="mt-4 text-slate-600">No tasks match your filters.</div>
              ) : (
                <div className="mt-4 space-y-4">
                  {shownTasks.map(t => {
                    const isCompleted = normalizeStatus(t.status) === 'completed'
                    const dueText = t.dueDate ? new Date(t.dueDate).toLocaleString() : '—'
                    const open = !!expanded[t._id]
                    return (
                      <div
                        key={t._id}
                        className={`border rounded-xl p-4 bg-white/70 shadow-sm ${isCompleted ? 'border-emerald-200' : 'border-yellow-200'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center border ${isCompleted ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                              {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-slate-900 truncate">{t.title}</div>
                              {t.details && <div className="text-sm text-slate-700 mt-0.5 line-clamp-2">{t.details}</div>}
                              <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5" /> Due: {dueText}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2 py-1 rounded text-xs ${isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}
                            >
                              {t.status}
                            </span>
                            <button
                              onClick={() => setExpanded(e => ({ ...e, [t._id]: !open }))}
                              className="px-3 py-1.5 rounded-md border text-sm bg-white hover:bg-slate-50"
                              title="View details"
                            >
                              <span className="inline-flex items-center gap-2">
                                <Eye className="h-4 w-4" /> {open ? 'Hide' : 'View'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {open && (
                          <div className="mt-4 border-t pt-3">
                            {t.details && (
                              <div className="text-sm text-slate-700 whitespace-pre-wrap">{t.details}</div>
                            )}

                            {/* Previous submissions */}
                            {(t.submissions?.length || 0) > 0 && (
                              <div className="mt-3">
                                <div className="text-sm font-medium">Your submissions</div>
                                <ul className="mt-1 space-y-1">
                                  {t.submissions.map((s) => (
                                    <li key={s._id} className="text-sm text-slate-700">
                                      <span className="text-xs text-slate-500 mr-2">
                                        {new Date(s.submittedAt).toLocaleString()}:
                                      </span>
                                      {s.link && (
                                        <a
                                          href={s.link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 underline mr-2"
                                        >
                                          <LinkIcon className="h-4 w-4" /> Link
                                        </a>
                                      )}
                                      {s.fileUrl && (
                                        <a
                                          href={s.fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 underline mr-2"
                                        >
                                          <Paperclip className="h-4 w-4" /> {s.filename || 'File'}
                                        </a>
                                      )}
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
                                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <input
                                    className="border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Drive/Git/Doc link"
                                    value={formMap[t._id]?.link || ''}
                                    onChange={e => setFormMap(m => ({ ...m, [t._id]: { ...(m[t._id]||{}), link: e.target.value } }))}
                                  />
                                  <input
                                    className="border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Note"
                                    value={formMap[t._id]?.note || ''}
                                    onChange={e => setFormMap(m => ({ ...m, [t._id]: { ...(m[t._id]||{}), note: e.target.value } }))}
                                  />
                                  <label className="border rounded-lg px-3 py-2 bg-white flex items-center gap-2 cursor-pointer">
                                    <UploadCloud className="h-4 w-4 text-slate-600" />
                                    <span className="text-slate-600 text-sm">Attach file</span>
                                    <input
                                      type="file"
                                      accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,image/*,text/plain"
                                      className="hidden"
                                      onChange={e => setFormMap(m => ({ ...m, [t._id]: { ...(m[t._id]||{}), file: e.target.files?.[0] || null } }))}
                                    />
                                  </label>
                                </div>
                                <div className="mt-3">
                                  <button
                                    onClick={() => submitWork(t._id)}
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-1.5 rounded-lg"
                                  >
                                    <Paperclip className="h-4 w-4" /> Submit Work
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
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