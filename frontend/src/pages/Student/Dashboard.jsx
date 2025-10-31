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

  // Highlight based on status and nextInterview (same as Track Application)
  function renderHighlight() {
    const iv = app?.nextInterview

    if (status === 'accepted') {
      return (
        <div className="mt-3 border rounded-lg p-3 bg-emerald-50 border-emerald-200 text-emerald-900">
          <div className="font-semibold">Your application is accepted</div>
          <div className="text-sm mt-1">Watch for project assignment or further instructions.</div>
        </div>
      )
    }

    if (status === 'rejected') {
      return (
        <div className="mt-3 border rounded-lg p-3 bg-rose-50 border-rose-200 text-rose-900">
          <div className="font-semibold">Your application was rejected</div>
          {!!app?.hodAction?.note && <div className="text-sm mt-1">Reason: {app.hodAction.note}</div>}
        </div>
      )
    }

    if (iv?.scheduledAt) {
      const when = new Date(iv.scheduledAt).toLocaleString()
      return (
        <div className="mt-3 border rounded-lg p-3 bg-indigo-50 border-indigo-200 text-indigo-900">
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
        <div className="mt-3 border rounded-lg p-3 bg-amber-50 border-amber-200 text-amber-900">
          <div className="font-semibold">Pending review</div>
          {!!app?.hodAction?.note && <div className="text-sm mt-1">HOD note: {app.hodAction.note}</div>}
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => window.history.back()} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">Back</button>
          <h1 className="text-xl font-semibold">Student Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-90">{user?.name} ({user?.email})</span>
          <button onClick={logout} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md">Logout</button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Compact Status Summary */}
        <section className="bg-white rounded-xl shadow p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-medium">Application Status</h2>
                <span className={`px-2 py-1 rounded text-xs ${statusStyles[status]}`}>
                  {(['none','new'].includes(status)) ? 'no application' : statusLabel}
                </span>
                {hasProject && (
                  <span className="px-2 py-1 rounded text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                    project assigned
                  </span>
                )}
              </div>

              {/* removed the brief one-line message; only highlight based on app.message */}
              {renderHighlight()}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/student/status')}
                className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg"
              >
                Track Application
              </button>
              {hasProject && (
                <button
                  onClick={() => navigate('/student/project')}
                  className="whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg"
                >
                  Project
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Actions: Add/Update only */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-base font-semibold mb-2">Add Application</h3>
            <p className="text-sm text-slate-600 mb-4">
              {isAccepted
                ? 'Your application is approved. You cannot update it.'
                : isRejected
                ? 'Your application was rejected. You cannot submit again.'
                : 'Submit or update your application.'}
            </p>
            <button
              onClick={() => navigate('/student/apply')}
              disabled={!canEdit}
              aria-disabled={!canEdit}
              title={!canEdit ? 'Not allowed after approval/rejection' : ''}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg
                         disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed"
            >
              {buttonLabel}
            </button>
          </div>
          {/* ...keep any other cards you need (e.g., Faculty/Tasks after acceptance)... */}
        </section>

        {/* Your Project section (kept) */}
        {!!app.assignedProjectTitle && (
          <section className="bg-white rounded-xl shadow p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-800">Your Project</h3>
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
              </div>
              <button
                onClick={() => navigate('/student/project')}
                className="whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg"
              >
                Project Description
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}