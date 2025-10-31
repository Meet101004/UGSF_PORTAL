import React, { useEffect, useState } from 'react'
import { clearAuth, getUser } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { getMyApplication } from '../../api/applications'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const user = getUser()

  const [loading, setLoading] = useState(true)
  const [app, setApp] = useState({ exists: false, status: 'none', message: '', lastUpdate: null })

  // Normalize API response so status is always present
  function normalizeApp(x) {
    const src = x && typeof x === 'object' ? x : {}
    return {
      exists: !!src.exists,
      status: src.status ?? 'none',
      message: src.message ?? '',
      lastUpdate: src.lastUpdate ?? null,
      assignedProjectTitle: src.assignedProjectTitle ?? null,
      assignedProjectDescription: src.assignedProjectDescription ?? null,
      assignedProjectLink: src.assignedProjectLink ?? null,
      assignedAt: src.assignedAt ?? null,
      // keep extra fields used by Track Application
      department: src.department ?? null,
      hodAction: src.hodAction ?? null,
      nextInterview: src.nextInterview ?? null,
      documents: src.documents ?? undefined,
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const raw = await getMyApplication()
        // handle both {data: {...}} and {...}
        const data = raw?.data ?? raw
        if (mounted) setApp(normalizeApp(data))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  function logout() {
    clearAuth()
    navigate('/login', { replace: true })
  }

  const statusStyles = {
    none: 'bg-slate-100 text-slate-700',
    new: 'bg-slate-100 text-slate-700', // treat 'new' like 'none'
    submitted: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-rose-100 text-rose-800'
  }

  // Always derive a safe status
  const status = app?.status ?? 'none'
  const statusLabel = status === 'submitted' ? 'pending' : status

  console.log('status:', status, 'app:', app)

  // Enable editing when status is 'none' or 'new' (and still allow when 'submitted')
  const isAccepted = status === 'accepted'
  const isRejected = status === 'rejected'
  const canEdit = ['none', 'new', 'submitted'].includes(status)
  const buttonLabel = (status === 'none' || status === 'new') ? 'Add Application' : 'Update Application'

  const hasProject = !!app.assignedProjectTitle

  // URL helper to support relative URLs from API
  const API_BASE = import.meta.env.VITE_API_URL || ''
  const abs = (url) => (!url ? '' : /^https?:\/\//i.test(url) ? url : `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`)

  // Frontend-only pagination for documents gallery
  const DOC_LABELS = { aadharCard: 'Aadhar Card', incomeCertificate: 'Income Certificate', resume: 'Resume', resultsheet: 'Result Sheet' }
  const docEntries = Object.entries(app?.documents || {})
  const [docPage, setDocPage] = useState(1)
  const DOC_PAGE_SIZE = 4
  const totalDocPages = Math.max(1, Math.ceil(docEntries.length / DOC_PAGE_SIZE))
  const start = (docPage - 1) * DOC_PAGE_SIZE
  const pagedDocs = docEntries.slice(start, start + DOC_PAGE_SIZE)

  // Highlight based on status and nextInterview (same as Track Application)
  function renderHighlight() {
    const iv = app?.nextInterview

    if (status === 'accepted') {
      return (
        <div className="mt-3 border rounded-xl p-4 bg-emerald-50/80 border-emerald-200 text-emerald-900 shadow-sm">
          <div className="font-semibold">Your application is accepted</div>
          <div className="text-sm mt-1">Watch for project assignment or further instructions.</div>
        </div>
      )
    }

    if (status === 'rejected') {
      return (
        <div className="mt-3 border rounded-xl p-4 bg-rose-50/80 border-rose-200 text-rose-900 shadow-sm">
          <div className="font-semibold">Your application was rejected</div>
          {!!app?.hodAction?.note && <div className="text-sm mt-1">Reason: {app.hodAction.note}</div>}
        </div>
      )
    }

    if (iv?.scheduledAt) {
      const when = new Date(iv.scheduledAt).toLocaleString()
      return (
        <div className="mt-3 border rounded-xl p-4 bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-sm">
          <div className="font-semibold">You have an interview scheduled</div>
          <div className="text-sm mt-1">When: {when}</div>
          <div className="text-sm mt-1 capitalize">Mode: {iv.mode}</div>
          {iv.mode === 'online' && iv.meetingUrl && (
            <div className="text-sm mt-1">
              Link: <a className="underline" href={iv.meetingUrl} target="_blank" rel="noreferrer">Join meeting</a>
            </div>
          )}
          {iv.mode === 'offline' && iv.location && (
            <div className="text-sm mt-1">Location: {iv.location}</div>
          )}
        </div>
      )
    }

    if (status === 'submitted') {
      return (
        <div className="mt-3 border rounded-xl p-4 bg-amber-50/80 border-amber-200 text-amber-900 shadow-sm">
          <div className="font-semibold">Pending review</div>
          {!!app?.hodAction?.note && <div className="text-sm mt-1">HOD note: {app.hodAction.note}</div>}
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-white">
      {/* Top bar styled like Login page theme */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
          
            <h1 className="text-xl font-semibold tracking-tight">Student Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm/6 opacity-90 hidden sm:block">
              {user?.name} ({user?.email})
            </span>
            <button
              onClick={logout}
              className="bg-white text-emerald-700 hover:bg-white/90 px-3 py-1.5 rounded-md font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Status + highlight */}
          <section className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">Application Status</h2>
                  <span className={`px-2 py-1 rounded text-xs capitalize ${statusStyles[status]}`}>
                    {(['none','new'].includes(status)) ? 'no application' : statusLabel}
                  </span>
                  {hasProject && (
                    <span className="px-2 py-1 rounded text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                      project assigned
                    </span>
                  )}
                </div>

                {renderHighlight()}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/student/status')}
                  className="whitespace-nowrap bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg shadow"
                >
                  Track Application
                </button>
                {hasProject && (
                  <button
                    onClick={() => navigate('/student/project')}
                    className="whitespace-nowrap bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg shadow"
                  >
                    Project
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Two-column: Quick action + Project */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Action */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Application</h3>
                <span className="text-xs text-slate-500">
                  {status === 'none' || status === 'new' ? 'Not started' : `Status: ${statusLabel}`}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                {isAccepted
                  ? 'Your application is approved. You cannot update it.'
                  : isRejected
                  ? 'Your application was rejected. You cannot submit again.'
                  : 'Submit or update your application.'}
              </p>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/student/apply')}
                  disabled={!canEdit}
                  aria-disabled={!canEdit}
                  title={!canEdit ? 'Not allowed after approval/rejection' : ''}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-4 py-2 rounded-lg shadow disabled:bg-slate-300 disabled:text-slate-600-white disabled:cursor-not-allowed"
                >
                  {buttonLabel}
                </button>
              </div>
            </div>

            {/* Project summary */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Your Project</h3>
                  {!app.assignedProjectTitle && (
                    <p className="text-sm text-slate-600 mt-2">You’ll see your assigned project here after acceptance.</p>
                  )}
                  {!!app.assignedProjectTitle && (
                    <>
                      <div className="mt-2 text-slate-900 font-medium">{app.assignedProjectTitle}</div>
                      {app.assignedProjectDescription && (
                        <div className="text-sm text-slate-600 mt-1">{app.assignedProjectDescription}</div>
                      )}
                      {app.assignedAt && (
                        <div className="text-xs text-slate-400 mt-2">
                          Assigned on {new Date(app.assignedAt).toLocaleString()}
                        </div>
                      )}
                      {app.assignedProjectLink && (
                        <div className="mt-2">
                          <a
                            href={app.assignedProjectLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-700 hover:text-indigo-900 underline text-sm"
                          >
                            Open project document
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {hasProject && (
                  <button
                    onClick={() => navigate('/student/project')}
                    className="whitespace-nowrap bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg shadow"
                  >
                    Project Details
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Optional: Documents gallery with frontend pagination (UI only) */}
          {docEntries.length > 0 && (
            <section className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Your Documents</h3>
                <div className="flex items-center gap-2 text-sm">
                  <button
                    className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    disabled={docPage <= 1}
                    onClick={() => setDocPage(p => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <span className="text-slate-500">
                    Page {docPage} of {totalDocPages}
                  </span>
                  <button
                    className="px-2 py-1 rounded-md border text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    disabled={docPage >= totalDocPages}
                    onClick={() => setDocPage(p => Math.min(totalDocPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {pagedDocs.map(([key, d]) => {
                  const url = abs(d?.url)
                  const isImg = (d?.mimetype || '').startsWith('image/')
                  return (
                    <div key={key} className="border rounded-xl p-3 bg-white/70">
                      <div className="flex items-center gap-3">
                        {url && isImg ? (
                          <div className="h-12 w-12 rounded bg-slate-100 flex items-center justify-center text-slate-500 text-xs">
                            Img
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded bg-slate-100 flex items-center justify-center text-slate-500 text-xs">
                            DOC
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-slate-800 text-sm font-medium truncate">{DOC_LABELS[key] || key}</div>
                          <div className="text-slate-500 text-xs truncate">{d?.filename || (url ? 'Uploaded' : 'Not uploaded')}</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-700 hover:text-emerald-900 underline text-sm"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-slate-400 text-sm">Not uploaded</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}