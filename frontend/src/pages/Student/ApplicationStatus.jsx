import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyApplication } from '../../api/applications'

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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Track Application</h1>
          <span className={`px-2 py-1 rounded text-xs ${pill}`}>{label}</span>
          {d?.department && <span className="text-xs text-slate-500">Department: {d.department}</span>}
          {canUpdate && (
            <button
              className="ml-auto text-sm underline text-emerald-700 hover:text-emerald-900"
              onClick={() => navigate('/student/apply?edit=1')}
            >
              Update Application
            </button>
          )}
        </div>

        {status === 'submitted' && d?.hodAction && (
          <div className="mt-4 border rounded-lg p-3 bg-yellow-50 border-yellow-200 text-yellow-900">
            <div className="font-semibold">HOD marked status as Pending</div>
            {(d.hodAction.note || d.hodAction.text) && (
              <div className="mt-1 text-sm">Remark: {d.hodAction.note || d.hodAction.text}</div>
            )}
            {d.hodAction.at && (
              <div className="mt-1 text-xs text-yellow-800/80">
                On: {new Date(d.hodAction.at).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {d?.nextInterview && (
          <div className="mt-4 border rounded-lg p-3 bg-emerald-50 border-emerald-200 text-emerald-900">
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
        )}

        {!!d?.assignedProjectTitle && (
          <div className="mt-4 border rounded-lg p-3 bg-indigo-50 border-indigo-200 text-indigo-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">Your Project</div>
                <div className="mt-1 text-sm text-slate-900">{d.assignedProjectTitle}</div>
                {d.assignedProjectDescription && (
                  <div className="mt-1 text-sm text-slate-700">{d.assignedProjectDescription}</div>
                )}
                {d.assignedAt && (
                  <div className="mt-1 text-xs text-slate-500">
                    Assigned on {new Date(d.assignedAt).toLocaleString()}
                  </div>
                )}
              </div>
              <button
                className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded"
                onClick={() => navigate('/student/project')}
              >
                Project Description
              </button>
            </div>
          </div>
        )}

        <p className="text-slate-700 mt-4">{d?.message || 'No updates yet.'}</p>
        {d?.lastUpdate && (
          <div className="mt-2 text-xs text-slate-400">Last update: {new Date(d.lastUpdate).toLocaleString()}</div>
        )}
      </div>
    </div>
  )
}