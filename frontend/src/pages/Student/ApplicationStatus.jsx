import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyApplication } from '../../api/applications'

// Inline icons
const CheckCircle = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="M22 4 12 14.01l-3-3" />
  </svg>
)
const XCircle = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
)
const Clock = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
)
const Calendar = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)

export default function ApplicationStatus() {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, data: null, error: '' })

  useEffect(() => {
    let mounted = true
    setState(s => ({ ...s, loading: true, error: '' }))
    getMyApplication()
      .then(d => mounted && setState({ loading: false, data: d, error: '' }))
      .catch(e => mounted && setState({ loading: false, data: null, error: e.message || 'Failed to load' }))
    return () => { mounted = false }
  }, [])

  const d = state.data
  const status = d?.status || 'none'
  const label = status === 'submitted' ? 'pending' : status
  const pill = {
    none: 'bg-slate-100 text-slate-700',
    submitted: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-rose-100 text-rose-800'
  }[status] || 'bg-slate-100 text-slate-700'
  const canUpdate = status === 'submitted' && d?.hodMarkedPending

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-white">
      {/* Header to match dashboard theme */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md"
            >
              Back
            </button>
            <h1 className="text-xl font-semibold tracking-tight">Track Application</h1>
          </div>
          {canUpdate && (
            <button
              className="text-sm bg-white text-emerald-700 hover:bg-white/90 px-3 py-1.5 rounded-md font-medium"
              onClick={() => navigate('/student/apply?edit=1')}
            >
              Update Application
            </button>
          )}
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Status Card */}
          <section className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Application Status</h2>
              <span className={`px-2 py-1 rounded text-xs capitalize ${pill}`}>{label}</span>
              {d?.department && <span className="text-xs text-slate-500">Department: {d.department}</span>}
            </div>

            {/* Highlights */}
            <div className="mt-4 space-y-3">
              {status === 'accepted' && (
                <div className="flex items-start gap-3 border rounded-xl p-4 bg-emerald-50/80 border-emerald-200 text-emerald-900">
                  <CheckCircle className="h-6 w-6 mt-0.5" />
                  <div>
                    <div className="font-semibold">Your application is accepted</div>
                    <div className="text-sm mt-1">Watch for project assignment or further instructions.</div>
                  </div>
                </div>
              )}

              {status === 'rejected' && (
                <div className="flex items-start gap-3 border rounded-xl p-4 bg-rose-50/80 border-rose-200 text-rose-900">
                  <XCircle className="h-6 w-6 mt-0.5" />
                  <div>
                    <div className="font-semibold">Your application was rejected</div>
                    {!!d?.hodAction?.note && (
                      <div className="text-sm mt-1">Reason: {d.hodAction.note}</div>
                    )}
                  </div>
                </div>
              )}

              {status === 'submitted' && d?.hodAction && (
                <div className="flex items-start gap-3 border rounded-xl p-4 bg-amber-50/80 border-amber-200 text-amber-900">
                  <Clock className="h-6 w-6 mt-0.5" />
                  <div>
                    <div className="font-semibold">HOD marked status as Pending</div>
                    {(d.hodAction.note || d.hodAction.text) && (
                      <div className="mt-1 text-sm">Remark: {d.hodAction.note || d.hodAction.text}</div>
                    )}
                    {d.hodAction.at && (
                      <div className="mt-1 text-xs text-amber-900/80">
                        On: {new Date(d.hodAction.at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {d?.nextInterview && (
                <div className="flex items-start gap-3 border rounded-xl p-4 bg-indigo-50/80 border-indigo-200 text-indigo-900">
                  <Calendar className="h-6 w-6 mt-0.5" />
                  <div>
                    <div className="font-semibold">Interview Scheduled</div>
                    <div className="mt-1 text-sm">
                      When: {new Date(d.nextInterview.scheduledAt).toLocaleString()}
                    </div>
                    <div className="mt-1 text-sm capitalize">Mode: {d.nextInterview.mode}</div>
                    {d.nextInterview.mode === 'online' && d.nextInterview.meetingUrl && (
                      <div className="mt-1 text-sm">
                        Link: <a className="underline" href={d.nextInterview.meetingUrl} target="_blank" rel="noreferrer">Join meeting</a>
                      </div>
                    )}
                    {d.nextInterview.mode === 'offline' && d.nextInterview.location && (
                      <div className="mt-1 text-sm">Location: {d.nextInterview.location}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer meta */}
            <div className="mt-4 border-t pt-3">
              <p className="text-slate-700">{d?.message || 'No updates yet.'}</p>
              {d?.lastUpdate && (
                <div className="mt-1 text-xs text-slate-500">Last update: {new Date(d.lastUpdate).toLocaleString()}</div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => navigate('/student/apply')}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg shadow"
                disabled={!canUpdate && status !== 'none' && status !== 'new' && status !== 'submitted'}
                aria-disabled={!canUpdate && status !== 'none' && status !== 'new' && status !== 'submitted'}
              >
                {canUpdate ? 'Update Application' : (status === 'none' || status === 'new') ? 'Start Application' : 'Application Locked'}
              </button>
              <button
                onClick={() => navigate('/student')}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg shadow"
              >
                Go to Dashboard
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}