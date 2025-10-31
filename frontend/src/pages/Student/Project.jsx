import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyApplication } from '../../api/applications'

export default function StudentProject() {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, data: null, error: '' })

  useEffect(() => {
    let mounted = true
    getMyApplication()
      .then(d => mounted && setState({ loading: false, data: d, error: '' }))
      .catch(e => mounted && setState({ loading: false, data: null, error: e.message || 'Failed to load' }))
    return () => { mounted = false }
  }, [])

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
        )}
      </main>
    </div>
  )
}