import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getHodApplication, setHodApplicationStatus } from '../../api/hod'
import { listHodInterviews, setInterviewResult } from '../../api/hod'
import { listDepartmentFaculties, assignFacultyProject } from '../../api/hod'

// Inline icons (no deps)
const Paperclip = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21.44 11.05 12 20.5a6 6 0 1 1-8.49-8.48l9.43-9.45a4 4 0 0 1 5.66 5.66L9.17 18.66a2 2 0 1 1-2.83-2.83l8.49-8.49"/></svg>)
const CalendarIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>)
const CheckIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5"/></svg>)
const XIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m18 6-12 12M6 6l12 12"/></svg>)
const InboxIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </svg>
)

const API_BASE = import.meta.env.VITE_API_URL || ''

function makeAbsolute(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`
}

export default function HODApplicationView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [app, setApp] = useState(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [actionLoading, setActionLoading] = useState('')
  const [saved, setSaved] = useState('')
  const [interviews, setInterviews] = useState([])
  const [irLoading, setIrLoading] = useState(false)
  const [irError, setIrError] = useState('')
  const [irNote, setIrNote] = useState('')
  const [irResult, setIrResult] = useState('pass')
  const [assignOpen, setAssignOpen] = useState(false)
  const [faculties, setFaculties] = useState([])
  const [assignForm, setAssignForm] = useState({
    facultyId: '',
    projectTitle: '',
    projectDescription: '',
    startDate: '',
    endDate: ''
  })
  const [assignErr, setAssignErr] = useState('')
  const [assignSaving, setAssignSaving] = useState(false)

  // helper: last HOD message
  const lastHod = (app?.messages || []).filter(m => m.by === 'hod').slice(-1)[0]
  const statusLabel = (app?.status === 'submitted') ? 'pending' : (app?.status || 'none')
  const statusPillCls = {
    none: 'bg-slate-100 text-slate-700',
    submitted: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-rose-100 text-rose-800'
  }[app?.status || 'none']

  // Disable actions if application is finalized
  const locked = app?.status === 'accepted' || app?.status === 'rejected'

  async function updateStatus(status) {
    if (locked) return
    try {
      setError(''); setSaved(''); setActionLoading(status)
      await setHodApplicationStatus(id, status, note || undefined)
      const updated = await getHodApplication(id)
      setApp(updated)
      setNote('')
      setSaved(status === 'submitted' ? 'Marked Pending' : status === 'accepted' ? 'Approved' : 'Rejected')
    } catch (e) {
      setError(e.message)
    } finally {
      setActionLoading('')
    }
  }

  const docs = app?.documents || {}
  const docLink = (d) => makeAbsolute(d?.url || null) // served via /files/:id, opens inline in browser

  // ADD: fetch application
  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')
    getHodApplication(id)
      .then(data => { if (mounted) setApp(data) })
      .catch(err => { if (mounted) setError(err.message || 'Failed to load') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  // fetch interviews
  useEffect(() => {
    if (!app?.student) return
    let mounted = true
    setIrLoading(true)
    listHodInterviews({ student: app.student })
      .then((rows) => { if (mounted) setInterviews(rows || []) })
      .catch((e) => { if (mounted) setIrError(e.message) })
      .finally(() => { if (mounted) setIrLoading(false) })
    return () => { mounted = false }
  }, [app?.student])

  const latestInterview = interviews?.[interviews.length - 1] || null
  const canAssign = (app?.status === 'accepted' || app?.finalResult === 'pass') && !app?.assignedFaculty

  async function openAssign() {
    setAssignErr('')
    setAssignForm({ facultyId: '', projectTitle: '', projectDescription: '', startDate: '', endDate: '' })
    try {
      const rows = await listDepartmentFaculties()
      setFaculties(rows || [])
      setAssignOpen(true)
    } catch (e) {
      setAssignErr(e.message)
    }
  }

  async function submitAssign(e) {
    e.preventDefault()
    setAssignErr('')
    if (!assignForm.facultyId) return setAssignErr('Select a faculty')
    if (!assignForm.projectTitle.trim()) return setAssignErr('Enter project title')

    // Map to backend fields
    const startAt = assignForm.startDate ? new Date(assignForm.startDate).toISOString() : undefined
    const endAt = assignForm.endDate ? new Date(assignForm.endDate).toISOString() : undefined

    try {
      setAssignSaving(true)
      await assignFacultyProject(id, {
        facultyId: assignForm.facultyId,
        projectTitle: assignForm.projectTitle.trim(),
        projectDescription: assignForm.projectDescription?.trim() || undefined,
        startAt,
        endAt
      })
      const updated = await getHodApplication(id)
      setApp(updated)
      setAssignOpen(false)
      setSaved('Faculty & Project Assigned')
    } catch (e) {
      setAssignErr(e.message)
    } finally {
      setAssignSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header (matches dashboard) */}
      <header className="bg-emerald-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold inline-flex items-center gap-2">
            <InboxIcon className="h-5 w-5" /> Application Details
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
        <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          {/* Top status chip */}
          <div className="flex items-center justify-end">
            {app && (
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-transparent ${statusPillCls}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>
                {statusLabel}
              </span>
            )}
          </div>

          {/* Title */}
          <div className="text-lg font-semibold text-slate-900">Application Details</div>

          {/* Messages/alerts */}
          {saved && <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 px-3 py-2">{saved} successfully.</div>}
          {lastHod && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 text-slate-800 px-3 py-2">
              <div className="text-sm"><span className="font-semibold">Last HOD action:</span> {lastHod.text}</div>
              {lastHod.note && <div className="text-sm">Remark: {lastHod.note}</div>}
              {lastHod.at && <div className="text-xs text-slate-500">On: {new Date(lastHod.at).toLocaleString()}</div>}
            </div>
          )}

          {loading ? 'Loading...' : error ? (
            <div className="text-red-600">{error}</div>
          ) : !app ? (
            <div>Not found</div>
          ) : (
            <>
              {/* Show only when accepted */}
              {app?.status === 'accepted' && (
                <div className="flex justify-end mb-3">
                  <button
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg"
                    onClick={() => navigate(`/hod/interviews/schedule/${id}`)}
                  >
                    Schedule Interview
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name" value={app.name} />
                <Field label="Email" value={app.email} />
                <Field label="Father Name" value={app.fatherName} />
                <Field label="Department" value={app.department} />
                <Field label="CGPA" value={app.cgpa ?? '—'} />
                <Field label="Father Income" value={app.fatherIncome ?? '—'} />
                <Field label="Status" value={statusLabel} />
                <Field label="Submitted" value={new Date(app.createdAt).toLocaleString()} />
              </div>

              <div className="mt-4">
                <div className="text-lg font-medium mb-2 inline-flex items-center gap-2">
                  <Paperclip className="h-5 w-5" /> Documents
                </div>
                <ul className="space-y-2">
                  {[
                    ['Aadhar Card', docs.aadharCard],
                    ['Income Certificate', docs.incomeCertificate],
                    ['Resume', docs.resume],
                    ['Result Sheet', docs.resultsheet]
                  ].map(([label, d]) => (
                    <li key={label} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                      <span className="text-slate-700">{label}</span>
                      {docLink(d) ? (
                        <a href={docLink(d)} target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-900 underline">
                          View
                        </a>
                      ) : (
                        <span className="text-slate-400">Not uploaded</span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-500 mt-2">Viewing opens in a new tab.</p>
              </div>

              <div className="mt-4 space-y-2">
                <label className="block text-sm text-slate-700">Note (optional)</label>
                <textarea className="w-full border rounded-lg px-3 py-2" rows={2} value={note} onChange={e => setNote(e.target.value)} />
                {locked && <div className="text-xs text-slate-500">Actions are disabled after approval/rejection.</div>}
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus('accepted')}
                    disabled={!!actionLoading || locked}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg"
                  >
                    {actionLoading === 'accepted' ? 'Saving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => updateStatus('rejected')}
                    disabled={!!actionLoading || locked}
                    className="bg-rose-600 hover:bg-rose-500 disabled:bg-rose-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg"
                  >
                    {actionLoading === 'rejected' ? 'Saving...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => updateStatus('submitted')}
                    disabled={!!actionLoading || locked}
                    className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg"
                  >
                    {actionLoading === 'submitted' ? 'Saving...' : 'Mark Pending'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Assignment summary
          {app?.assignedFaculty ? (
            <div className="rounded-lg border p-3 bg-emerald-50 border-emerald-200 text-emerald-900">
              <div className="font-semibold">Assigned Faculty & Project</div>
              <div className="text-sm mt-1">
                Faculty: {app.assignedFaculty?.name} ({app.assignedFaculty?.email})
              </div>
              {app.project?.title && <div className="text-sm">Project: {app.project.title}</div>}
              {app.project?.description && <div className="text-xs text-emerald-800/90">{app.project.description}</div>}
              {(app.project?.startDate || app.project?.endDate) && (
                <div className="text-xs mt-1">
                  {app.project?.startDate && <>Start: {new Date(app.project.startDate).toLocaleDateString()} </>}
                  {app.project?.endDate && <>• End: {new Date(app.project.endDate).toLocaleDateString()}</>}
                </div>
              )}
            </div>
          ) : canAssign && (
            <div className="flex justify-end">
              <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg" onClick={openAssign}>
                Assign Faculty & Project
              </button>
            </div>
          )} */}

          {/* Interview section */}
          {latestInterview && (
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-lg font-medium mb-2 inline-flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" /> Interview
              </div>
              <div className="text-sm text-slate-700">
                Scheduled: {new Date(latestInterview.scheduledAt).toLocaleString()} • Mode: {latestInterview.mode}
                {latestInterview.meetingUrl && (<> • <a href={latestInterview.meetingUrl} target="_blank" rel="noreferrer" className="underline text-emerald-700">Join Link</a></>)}
                {latestInterview.location && <> • Venue: {latestInterview.location}</>}
              </div>
              <div className="mt-2 text-sm">
                Current Result: <span className={`font-medium uppercase inline-flex items-center gap-1 px-2 py-0.5 rounded border ${latestInterview.result==='pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : latestInterview.result==='fail' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                  {latestInterview.result === 'pass' ? <CheckIcon className="h-4 w-4" /> : latestInterview.result === 'fail' ? <XIcon className="h-4 w-4" /> : null}
                  {latestInterview.result}
                </span>
              </div>

              {latestInterview.result === 'pending' && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="ir" value="pass" checked={irResult==='pass'} onChange={e=>setIrResult(e.target.value)} disabled={locked} />
                      <span>Pass</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="ir" value="fail" checked={irResult==='fail'} onChange={e=>setIrResult(e.target.value)} disabled={locked} />
                      <span>Fail</span>
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Remark (optional)"
                    value={irNote}
                    onChange={e=>setIrNote(e.target.value)}
                    disabled={locked}
                  />
                  {irError && <div className="text-sm text-red-600">{irError}</div>}
                  <button
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg"
                    onClick={async () => {
                      if (locked) return
                      try {
                        setIrError('')
                        await setInterviewResult(latestInterview._id, irResult, irNote || undefined)
                        const [rows, updated] = await Promise.all([
                          listHodInterviews({ student: app.student }),
                          getHodApplication(id)
                        ])
                        setInterviews(rows || [])
                        setApp(updated)
                        setNote('')
                        setSaved(irResult === 'pass' ? 'Interview Passed' : 'Interview Failed')
                      } catch (e) {
                        setIrError(e.message)
                      }
                    }}
                    disabled={locked}
                  >
                    Save Result
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Assign Modal */}
          {assignOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setAssignOpen(false)} />
              <form onSubmit={submitAssign} className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-6 space-y-4">
                <div className="text-lg font-semibold">Assign Faculty & Project</div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1">Faculty (same department)</label>
                  <select className="w-full border rounded-lg px-3 py-2"
                    value={assignForm.facultyId}
                    onChange={e => setAssignForm(f => ({ ...f, facultyId: e.target.value }))}
                  >
                    <option value="">Select faculty</option>
                    {faculties.map(f => (
                      <option key={f._id} value={f._id}>{f.name} ({f.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1">Project Title</label>
                  <input className="w-full border rounded-lg px-3 py-2"
                    value={assignForm.projectTitle}
                    onChange={e => setAssignForm(f => ({ ...f, projectTitle: e.target.value }))}
                    placeholder="e.g., AI-based Placement Portal"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1">Project Description (optional)</label>
                  <textarea rows={3} className="w-full border rounded-lg px-3 py-2"
                    value={assignForm.projectDescription}
                    onChange={e => setAssignForm(f => ({ ...f, projectDescription: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Start Date (optional)</label>
                    <input type="date" className="w-full border rounded-lg px-3 py-2"
                      value={assignForm.startDate}
                      onChange={e => setAssignForm(f => ({ ...f, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">End Date (optional)</label>
                    <input type="date" className="w-full border rounded-lg px-3 py-2"
                      value={assignForm.endDate}
                      onChange={e => setAssignForm(f => ({ ...f, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                {assignErr && <div className="text-sm text-red-600">{assignErr}</div>}

                <div className="flex justify-end gap-2">
                  <button type="button" className="px-4 py-2 rounded-lg border" onClick={() => setAssignOpen(false)}>Cancel</button>
                  <button disabled={assignSaving || locked} className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60 disabled:cursor-not-allowed">
                    {assignSaving ? 'Saving...' : 'Assign'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-slate-800">{value}</div>
    </div>
  )
}