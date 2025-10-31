    import React, { useEffect, useState, useMemo } from 'react'
    import { clearAuth, getUser } from '../../store/authStore'
    import { useNavigate } from 'react-router-dom'
    import { getHodApplications, } from '../../api/hod'
    import { scheduleInterview, listHodInterviews, setInterviewResult } from '../../api/hod'

    // Inline icons (no extra deps)
    const UsersIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>)
    const InboxIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>)
    const FilterIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 3H2l8 9v7l4 2v-9l8-9z"/></svg>)
    const CalendarIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>)
    const VideoIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>)
    const MapPinIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20.84 10.61A8 8 0 1 0 3.16 10.6a8 8 0 0 0 17.68 0Z"/><circle cx="12" cy="10" r="3"/></svg>)
    const EyeIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>)
    const CheckIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5"/></svg>)
    const XIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m18 6-12 12M6 6l12 12"/></svg>)
    const ChevronDown = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6 9 6 6 6-6"/></svg>)

    export default function HODDashboard() {
      const navigate = useNavigate()
      const user = getUser()
      const [loading, setLoading] = useState(true)
      const [apps, setApps] = useState([])
      const [filter, setFilter] = useState('all') // default to All students
      const [modalOpen, setModalOpen] = useState(false)
      const [selected, setSelected] = useState(null) // selected application row
      const [saving, setSaving] = useState(false)
      const [form, setForm] = useState({ date: '', time: '', mode: 'online', meetingUrl: '', location: '', notes: '' })
      const [formErr, setFormErr] = useState('')
      const [toast, setToast] = useState('')
      const [pendingInterviews, setPendingInterviews] = useState([])
      const [allInterviews, setAllInterviews] = useState([])
      const [completedInterviews, setCompletedInterviews] = useState([])
      const [resultOpen, setResultOpen] = useState(false)
      const [selectedInterview, setSelectedInterview] = useState(null)
      const [resultSaving, setResultSaving] = useState(false)
      const [resultForm, setResultForm] = useState({ result: 'pass', note: '' })
      const [editingPrefill, setEditingPrefill] = useState(null) // last interview for student

      // Collapsible sections (Applications open by default)
      const [appsOpen, setAppsOpen] = useState(true)
      const [pendingOpen, setPendingOpen] = useState(false)
      const [recentOpen, setRecentOpen] = useState(false)
      const [passedOpen, setPassedOpen] = useState(false)

      // Pagination states (per section)
      const [appsPage, setAppsPage] = useState(1)
      const [appsPageSize, setAppsPageSize] = useState(10)
      const [pndPage, setPndPage] = useState(1)
      const [pndPageSize, setPndPageSize] = useState(5)
      const [rcPage, setRcPage] = useState(1)
      const [rcPageSize, setRcPageSize] = useState(10)
      const [psPage, setPsPage] = useState(1)
      const [psPageSize, setPsPageSize] = useState(10)

      // optional: load upcoming interviews (if you want to show somewhere)
      // const [upcoming, setUpcoming] = useState([])
      // useEffect(() => { listHodInterviews({ upcoming: true }).then(setUpcoming).catch(()=>{}) }, [])

      function openSchedule(app) {
        setSelected(app)
        setForm({ date: '', time: '', mode: 'online', meetingUrl: '', location: '', notes: '' })
        setFormErr('')
        setEditingPrefill(null)
        // Prefill with latest interview if exists
        listHodInterviews({ student: app.student }).then(rows => {
          const last = (rows || []).slice(-1)[0]
          if (last) {
            const dt = new Date(last.scheduledAt)
            setEditingPrefill(last)
            setForm({
              date: dt.toISOString().slice(0,10),
              time: dt.toTimeString().slice(0,5),
              mode: last.mode,
              meetingUrl: last.meetingUrl || '',
              location: last.location || '',
              notes: last.notes || ''
            })
          }
        }).finally(() => setModalOpen(true))
      }

      function combineISO(d, t) {
        if (!d || !t) return null
        return new Date(`${d}T${t}:00`)
      }

      async function submitSchedule(e) {
        e.preventDefault()
        setFormErr('')
        const when = combineISO(form.date, form.time)
        if (!when) return setFormErr('Select date and time')
        if (when.getTime() <= Date.now()) return setFormErr('Selected time must be in the future')
        if (form.mode === 'online' && !/^https?:\/\//i.test(form.meetingUrl || '')) return setFormErr('Enter a valid meeting link (https://...)')
        if (form.mode === 'offline' && !form.location.trim()) return setFormErr('Enter a venue for offline interview')

        try {
          setSaving(true)
          await scheduleInterview({
            applicationId: selected._id,
            scheduledAt: when.toISOString(),
            mode: form.mode,
            meetingUrl: form.mode === 'online' ? form.meetingUrl : undefined,
            location: form.mode === 'offline' ? form.location : undefined,
            notes: form.notes || undefined
          })
          setModalOpen(false)
          setToast('Interview scheduled')
          // refresh current list if needed
          setLoading(true)
          getHodApplications(filter === 'all' ? {} : { status: filter })
            .then(data => setApps(data))
            .finally(() => setLoading(false))
          setTimeout(() => setToast(''), 2000)
        } catch (e) {
          setFormErr(e.message)
        } finally {
          setSaving(false)
        }
      }

      function openResultModal(interview) {
        setSelectedInterview(interview)
        setResultForm({ result: 'pass', note: '' })
        setResultOpen(true)
      }

      async function submitResult(e) {
        e.preventDefault()
        try {
          setResultSaving(true)
          await setInterviewResult(selectedInterview._id, resultForm.result, resultForm.note || undefined)
          setResultOpen(false)
          setToast('Interview result saved')
          // refresh pending list
          const rows = await listHodInterviews()
          setPendingInterviews((rows || []).filter(r => r.result === 'pending'))
        } catch (err) {
          setFormErr(err.message)
        } finally {
          setResultSaving(false)
        }
      }

      // load apps (unchanged)
      useEffect(() => {
        let mounted = true
        setLoading(true)
        getHodApplications(filter === 'all' ? {} : { status: filter })
          .then(data => { if (mounted) setApps(data) })
          .finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false }
      }, [filter])

      // Load interviews (all), then derive pending/completed
      useEffect(() => {
        let mounted = true
        listHodInterviews()
          .then(rows => {
            if (!mounted) return
            const arr = rows || []
            setAllInterviews(arr)
            setPendingInterviews(arr.filter(r => r.result === 'pending'))
            setCompletedInterviews(arr.filter(r => r.result === 'pass' || r.result === 'fail')
              .sort((a,b) => new Date(b.scoredAt || b.scheduledAt) - new Date(a.scoredAt || a.scheduledAt)))
          })
          .catch(()=>{})
        return () => { mounted = false }
      }, [toast]) // refresh after scheduling/result save

      // Latest interview per student (by scheduledAt)
      const latestByStudent = useMemo(() => {
        const map = {}
        for (const iv of allInterviews) {
          const sid = iv.student?._id || iv.student
          if (!sid) continue
          const prev = map[sid]
          if (!prev || new Date(iv.scheduledAt) > new Date(prev.scheduledAt)) {
            map[sid] = iv
          }
        }
        return map
      }, [allInterviews])

      // Derived: Passed students list (unique per student)
      const passedList = useMemo(() => {
        const seen = new Set()
        const out = []
        for (const iv of completedInterviews) {
          if (iv.result !== 'pass') continue
          const sid = iv.student?._id || iv.student
          if (!sid || seen.has(sid)) continue
          seen.add(sid)
          out.push(iv)
        }
        return out
      }, [completedInterviews])

      const pill = s => ({
        submitted: 'bg-yellow-100 text-yellow-800',
        accepted: 'bg-emerald-100 text-emerald-800',
        rejected: 'bg-rose-100 text-rose-800'
      }[s] || 'bg-slate-100 text-slate-700')

      function logout() {
        clearAuth()
        navigate('/login', { replace: true })
      }

      return (
        <div className="min-h-screen bg-slate-50">
          <header className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <UsersIcon className="h-5 w-5" /> HOD Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm opacity-90">{user?.name} ({user?.email})</span>
              <button onClick={logout} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">Logout</button>
            </div>
          </header>

          <main className="p-6 space-y-4">
            {/* Quick actions */}
            <div className="flex gap-3">
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded inline-flex items-center gap-2" onClick={() => navigate('/hod/assignments')}>
                <InboxIcon className="h-4 w-4" /> Assignments
              </button>
            </div>

            {toast && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded">{toast}</div>}

            {/* Summary + filter */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <div className="text-slate-700 font-medium">Department: {user?.department || '—'}</div>
                  <div className="text-slate-500 text-sm">Review student applications</div>
                </div>
              </div>
              <div className="inline-flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-slate-500 hidden sm:block" />
                <div className="inline-flex rounded-md border border-slate-200 bg-white overflow-hidden">
                  {['pending','accepted','rejected','all'].map(f => (
                    <button key={f}
                      className={`px-3 py-1.5 text-sm ${filter===f ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                      onClick={() => { setFilter(f); setAppsPage(1) }}
                    >
                      {f[0].toUpperCase()+f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Applications (collapsible + pagination) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <button type="button" onClick={() => setAppsOpen(o => !o)} className="inline-flex items-center gap-2 text-slate-800 font-semibold">
                  <InboxIcon className="h-4 w-4" />
                  Applications
                  <span className="text-xs text-slate-500">({apps.length})</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${appsOpen ? 'rotate-180' : ''}`} />
                </button>
                <Pagination
                  page={appsPage}
                  pageSize={appsPageSize}
                  total={apps.length}
                  onPage={(p) => setAppsPage(p)}
                  onPageSize={(s) => { setAppsPageSize(s); setAppsPage(1) }}
                  sizes={[5,10,20]}
                />
              </div>
              {appsOpen && (
                <div className="overflow-x-auto">
                  {(() => {
                    const total = apps.length
                    const pages = Math.max(1, Math.ceil(total / appsPageSize))
                    const page = Math.min(Math.max(1, appsPage), pages)
                    const start = (page - 1) * appsPageSize
                    const slice = apps.slice(start, start + appsPageSize)
                    return (
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50/80">
                          <tr>
                            <th className="text-left px-4 py-2">Name</th>
                            <th className="text-left px-4 py-2">Email</th>
                            <th className="text-left px-4 py-2">Status</th>
                            <th className="text-left px-4 py-2">Submitted</th>
                            <th className="text-left px-4 py-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr><td className="px-4 py-3" colSpan={5}>Loading...</td></tr>
                          ) : slice.length === 0 ? (
                            <tr><td className="px-4 py-3" colSpan={5}>No applications</td></tr>
                          ) : slice.map(a => {
                            const sid = a.student
                            const latest = sid ? latestByStudent[sid] : null
                            const hasPendingIv = latest && latest.result === 'pending'
                            const hasCompletedIv = latest && (latest.result === 'pass' || latest.result === 'fail')
                            return (
                              <tr key={a._id} className="border-t">
                                <td className="px-4 py-2">{a.name}</td>
                                <td className="px-4 py-2">{a.email}</td>
                                <td className="px-4 py-2">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border border-transparent ${pill(a.status)}`}>
                                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>
                                    {a.status === 'submitted' ? 'pending' : a.status}
                                  </span>
                                  {hasCompletedIv && (
                                    <span className={`ml-2 inline-flex items-center gap-1 px-2 py-1 rounded border ${latest.result === 'pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                      {latest.result === 'pass' ? <CheckIcon className="h-3.5 w-3.5" /> : <XIcon className="h-3.5 w-3.5" />} interview {latest.result}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2">{new Date(a.createdAt).toLocaleString()}</td>
                                <td className="px-4 py-2 space-x-3">
                                  <button className="text-emerald-700 hover:text-emerald-900 underline inline-flex items-center gap-1" onClick={() => navigate(`/hod/applications/${a._id}`)}>
                                    <EyeIcon className="h-4 w-4" /> View
                                  </button>
                                  {a.status === 'accepted' && !hasCompletedIv && (
                                    <button className="text-slate-700 hover:text-slate-900 underline inline-flex items-center gap-1" onClick={() => openSchedule(a)}>
                                      <CalendarIcon className="h-4 w-4" /> {hasPendingIv ? 'Update Interview' : 'Schedule Interview'}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Pending interviews (collapsible + pagination) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <button type="button" onClick={() => setPendingOpen(o => !o)} className="inline-flex items-center gap-2 text-slate-800 font-semibold">
                  <CalendarIcon className="h-4 w-4" /> Pending Interviews
                  <span className="text-xs text-slate-500">({pendingInterviews.length})</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${pendingOpen ? 'rotate-180' : ''}`} />
                </button>
                <Pagination
                  page={pndPage}
                  pageSize={pndPageSize}
                  total={pendingInterviews.length}
                  onPage={(p) => setPndPage(p)}
                  onPageSize={(s) => { setPndPageSize(s); setPndPage(1) }}
                  sizes={[5,10,20]}
                />
              </div>
              {pendingOpen && (
                <div className="overflow-x-auto">
                  {(() => {
                    const total = pendingInterviews.length
                    const pages = Math.max(1, Math.ceil(total / pndPageSize))
                    const page = Math.min(Math.max(1, pndPage), pages)
                    const start = (page - 1) * pndPageSize
                    const slice = pendingInterviews.slice(start, start + pndPageSize)
                    return (
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left px-4 py-2">Student</th>
                            <th className="text-left px-4 py-2">When</th>
                            <th className="text-left px-4 py-2">Mode</th>
                            <th className="text-left px-4 py-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {slice.length === 0 ? (
                            <tr><td className="px-4 py-3" colSpan={4}>No pending interviews</td></tr>
                          ) : slice.map(iv => (
                            <tr key={iv._id} className="border-t">
                              <td className="px-4 py-2">{iv.student?.name} ({iv.student?.email})</td>
                              <td className="px-4 py-2">{new Date(iv.scheduledAt).toLocaleString()}</td>
                              <td className="px-4 py-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                                  {iv.mode === 'online' ? <VideoIcon className="h-4 w-4" /> : <MapPinIcon className="h-4 w-4" />}
                                  {iv.mode === 'online' ? 'Online' : 'Offline'}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <button className="text-emerald-700 hover:text-emerald-900 underline inline-flex items-center gap-1" onClick={() => openResultModal(iv)}>
                                  <CheckIcon className="h-4 w-4" /> Set Result
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Recent interviews (collapsible + pagination) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <button type="button" onClick={() => setRecentOpen(o => !o)} className="inline-flex items-center gap-2 text-slate-800 font-semibold">
                  <InboxIcon className="h-4 w-4" /> Recent Interviews
                  <span className="text-xs text-slate-500">({completedInterviews.length})</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${recentOpen ? 'rotate-180' : ''}`} />
                </button>
                <Pagination
                  page={rcPage}
                  pageSize={rcPageSize}
                  total={completedInterviews.length}
                  onPage={(p) => setRcPage(p)}
                  onPageSize={(s) => { setRcPageSize(s); setRcPage(1) }}
                  sizes={[5,10,20]}
                />
              </div>
              {recentOpen && (
                <div className="overflow-x-auto">
                  {(() => {
                    const total = completedInterviews.length
                    const pages = Math.max(1, Math.ceil(total / rcPageSize))
                    const page = Math.min(Math.max(1, rcPage), pages)
                    const start = (page - 1) * rcPageSize
                    const slice = completedInterviews.slice(start, start + rcPageSize)
                    return (
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left px-4 py-2">Student</th>
                            <th className="text-left px-4 py-2">When</th>
                            <th className="text-left px-4 py-2">Result</th>
                            <th className="text-left px-4 py-2">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {slice.length === 0 ? (
                            <tr><td className="px-4 py-3" colSpan={4}>No recent interviews</td></tr>
                          ) : slice.map(iv => (
                            <tr key={iv._id} className="border-t">
                              <td className="px-4 py-2">{iv.student?.name} ({iv.student?.email})</td>
                              <td className="px-4 py-2">{new Date(iv.scoredAt || iv.scheduledAt).toLocaleString()}</td>
                              <td className="px-4 py-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${iv.result === 'pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                  {iv.result === 'pass' ? <CheckIcon className="h-4 w-4" /> : <XIcon className="h-4 w-4" />} {iv.result}
                                </span>
                              </td>
                              <td className="px-4 py-2">{iv.notes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Passed students (collapsible + pagination) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <button type="button" onClick={() => setPassedOpen(o => !o)} className="inline-flex items-center gap-2 text-slate-800 font-semibold">
                  <CheckIcon className="h-4 w-4" /> Students Passed Interview
                  <span className="text-xs text-slate-500">({passedList.length})</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${passedOpen ? 'rotate-180' : ''}`} />
                </button>
                <Pagination
                  page={psPage}
                  pageSize={psPageSize}
                  total={passedList.length}
                  onPage={(p) => setPsPage(p)}
                  onPageSize={(s) => { setPsPageSize(s); setPsPage(1) }}
                  sizes={[5,10,20]}
                />
              </div>
              {passedOpen && (
                <div className="overflow-x-auto">
                  {(() => {
                    const total = passedList.length
                    const pages = Math.max(1, Math.ceil(total / psPageSize))
                    const page = Math.min(Math.max(1, psPage), pages)
                    const start = (page - 1) * psPageSize
                    const slice = passedList.slice(start, start + psPageSize)
                    return (
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left px-4 py-2">Student</th>
                            <th className="text-left px-4 py-2">Email</th>
                            <th className="text-left px-4 py-2">Passed On</th>
                          </tr>
                        </thead>
                        <tbody>
                          {slice.length === 0 ? (
                            <tr><td className="px-4 py-3" colSpan={3}>No students passed yet</td></tr>
                          ) : slice.map(iv => (
                            <tr key={iv._id} className="border-t">
                              <td className="px-4 py-2">{iv.student?.name}</td>
                              <td className="px-4 py-2">{iv.student?.email}</td>
                              <td className="px-4 py-2">{new Date(iv.scoredAt || iv.scheduledAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Schedule Interview modal */}
            {modalOpen && (
              <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 max-w-lg w-full">
                  <div className="text-slate-800 text-lg font-semibold mb-4 inline-flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" /> {editingPrefill ? 'Update' : 'Schedule'} Interview
                  </div>
                  {formErr && <div className="text-red-500 text-sm mb-4">{formErr}</div>}
                  <form onSubmit={submitSchedule} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">Date</label>
                        <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                          className="w-full border rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">Time</label>
                        <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                          className="w-full border rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Mode</label>
                      <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>
                    {form.mode === 'online' && (
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">Meeting URL</label>
                        <input type="url" value={form.meetingUrl} onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))}
                          className="w-full border rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="https://example.com/meeting"
                        />
                      </div>
                    )}
                    {form.mode === 'offline' && (
                      <div>
                        <label className="block text-sm text-slate-700 mb-1">Location</label>
                        <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                          className="w-full border rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Enter venue address"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Notes</label>
                      <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                        rows={3}
                        placeholder="Any additional notes for the interview"
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setModalOpen(false)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-slate-300">
                        Cancel
                      </button>
                      <button type="submit" disabled={saving} className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-emerald-700">
                        {saving ? 'Saving...' : 'Save Interview'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Result modal */}
            {resultOpen && (
              <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 max-w-lg w-full">
                  <div className="text-slate-800 text-lg font-semibold mb-4 inline-flex items-center gap-2">
                    <CheckIcon className="h-5 w-5" /> Set Interview Result
                  </div>
                  {formErr && <div className="text-red-500 text-sm mb-4">{formErr}</div>}
                  <form onSubmit={submitResult} className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Result</label>
                      <select value={resultForm.result} onChange={e => setResultForm(f => ({ ...f, result: e.target.value }))}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Notes</label>
                      <textarea value={resultForm.note} onChange={e => setResultForm(f => ({ ...f, note: e.target.value }))}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                        rows={3}
                        placeholder="Any additional notes for the result"
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setResultOpen(false)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-slate-300">
                        Cancel
                      </button>
                      <button type="submit" disabled={resultSaving} className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-emerald-700">
                        {resultSaving ? 'Saving...' : 'Save Result'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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
          <button
            className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => onPage?.(1)}
            disabled={!canPrev}
            title="First"
          >
            « First
          </button>
          <button
            className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => onPage?.(p - 1)}
            disabled={!canPrev}
            title="Previous"
          >
            ‹ Prev
          </button>
          <span className="text-sm text-slate-500 px-1">Page {p} of {pages}</span>
          <button
            className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => onPage?.(p + 1)}
            disabled={!canNext}
            title="Next"
          >
            Next ›
          </button>
          <button
            className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => onPage?.(pages)}
            disabled={!canNext}
            title="Last"
          >
            Last »
          </button>
        </div>
      )
    }