import React, { useEffect, useState, useMemo } from 'react'
import { clearAuth, getUser } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { getHodApplications, } from '../../api/hod'
import { scheduleInterview, listHodInterviews, setInterviewResult } from '../../api/hod'

export default function HODDashboard() {
  const navigate = useNavigate()
  const user = getUser()
  const [loading, setLoading] = useState(true)
  const [apps, setApps] = useState([])
  const [filter, setFilter] = useState('pending') // pending | accepted | rejected | all
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
        <h1 className="text-xl font-semibold">HOD Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-90">{user?.name} ({user?.email})</span>
          <button onClick={logout} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">Logout</button>
        </div>
      </header>

      <main className="p-6 space-y-4">
        {/* Quick actions */}
        <div className="flex gap-3">
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded" onClick={() => navigate('/hod/assignments')}>
            Assignments
          </button>
        </div>

        {toast && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded">{toast}</div>}

        <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
          <div>
            <div className="text-slate-700 font-medium">Department: {user?.department || '—'}</div>
            <div className="text-slate-500 text-sm">Review student applications</div>
          </div>
          <div className="inline-flex border rounded-md overflow-hidden">
            {['pending','accepted','rejected','all'].map(f => (
              <button key={f}
                className={`px-3 py-1.5 ${filter===f ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}
                onClick={() => setFilter(f)}
              >
                {f[0].toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
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
              ) : apps.length === 0 ? (
                <tr><td className="px-4 py-3" colSpan={5}>No applications</td></tr>
              ) : apps.map(a => {
                  const sid = a.student // now provided by backend
                  const latest = sid ? latestByStudent[sid] : null
                  const hasPendingIv = latest && latest.result === 'pending'
                  const hasCompletedIv = latest && (latest.result === 'pass' || latest.result === 'fail')
 return (
   <tr key={a._id} className="border-t">
     <td className="px-4 py-2">{a.name}</td>
     <td className="px-4 py-2">{a.email}</td>
     <td className="px-4 py-2">
       <span className={`px-2 py-1 rounded ${pill(a.status)}`}>
         {a.status === 'submitted' ? 'pending' : a.status}
       </span>
       {hasCompletedIv && (
         <span className={`ml-2 px-2 py-1 rounded ${latest.result === 'pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
           interview {latest.result}
         </span>
       )}
     </td>
     <td className="px-4 py-2">{new Date(a.createdAt).toLocaleString()}</td>
     <td className="px-4 py-2 space-x-3">
       <button
         className="text-emerald-700 hover:text-emerald-900 underline"
         onClick={() => navigate(`/hod/applications/${a._id}`)}
       >
         View
       </button>
       {a.status === 'accepted' && !hasCompletedIv && (
         <button
           className="text-slate-700 hover:text-slate-900 underline"
           onClick={() => openSchedule(a)}
         >
           {hasPendingIv ? 'Update Interview' : 'Schedule Interview'}
         </button>
       )}
     </td>
   </tr>
 )
              })}
            </tbody>
          </table>
        </div>

        {/* Pending interviews table */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <div className="px-4 py-3 border-b text-slate-800 font-semibold">Pending Interviews</div>
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
              {pendingInterviews.length === 0 ? (
                <tr><td className="px-4 py-3" colSpan={4}>No pending interviews</td></tr>
              ) : pendingInterviews.map(iv => (
                <tr key={iv._id} className="border-t">
                  <td className="px-4 py-2">{iv.student?.name} ({iv.student?.email})</td>
                  <td className="px-4 py-2">{new Date(iv.scheduledAt).toLocaleString()}</td>
                  <td className="px-4 py-2">{iv.mode === 'online' ? 'Online' : 'Offline'}</td>
                  <td className="px-4 py-2">
                    <button className="text-emerald-700 hover:text-emerald-900 underline" onClick={() => openResultModal(iv)}>
                      Set Result
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Interviews (completed, last 10) */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <div className="px-4 py-3 border-b text-slate-800 font-semibold">Recent Interviews</div>
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
              {completedInterviews.length === 0 ? (
                <tr><td className="px-4 py-3" colSpan={4}>No recent interviews</td></tr>
              ) : completedInterviews.slice(0, 10).map(iv => (
                <tr key={iv._id} className="border-t">
                  <td className="px-4 py-2">{iv.student?.name} ({iv.student?.email})</td>
                  <td className="px-4 py-2">{new Date(iv.scoredAt || iv.scheduledAt).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded ${iv.result === 'pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {iv.result}
                    </span>
                  </td>
                  <td className="px-4 py-2">{iv.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Passed Students */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <div className="px-4 py-3 border-b text-slate-800 font-semibold">Students Passed Interview</div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2">Student</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Passed On</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const seen = new Set()
                const passed = []
                for (const iv of completedInterviews) {
                  if (iv.result !== 'pass') continue
                  const sid = iv.student?._id || iv.student
                  if (seen.has(sid)) continue
                  seen.add(sid)
                  passed.push(iv)
                }
                if (passed.length === 0) return (
                  <tr><td className="px-4 py-3" colSpan={3}>No students passed yet</td></tr>
                )
                return passed.map(iv => (
                  <tr key={iv._id} className="border-t">
                    <td className="px-4 py-2">{iv.student?.name}</td>
                    <td className="px-4 py-2">{iv.student?.email}</td>
                    <td className="px-4 py-2">{new Date(iv.scoredAt || iv.scheduledAt).toLocaleString()}</td>
                  </tr>
                ))
              })()}
            </tbody>
          </table>
        </div>

        {/* Schedule Interview modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full">
              <div className="text-slate-800 text-lg font-semibold mb-4">
                {editingPrefill ? 'Update' : 'Schedule'} Interview
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
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full">
              <div className="text-slate-800 text-lg font-semibold mb-4">
                Set Interview Result
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